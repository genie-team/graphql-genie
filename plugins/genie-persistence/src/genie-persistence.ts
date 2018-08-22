import PQueue from 'p-queue';
import ApolloClient, { ApolloQueryResult, MutationOptions, OperationVariables, QueryOptions } from 'apollo-client';
import { DocumentNode, FetchResult } from 'apollo-link';
import { GraphQLGenie } from 'graphql-genie';
import { checkDocument, cloneDeep, isEqual } from 'apollo-utilities';
import { DefinitionNode, FieldNode, GraphQLNamedType, GraphQLObjectType, OperationDefinitionNode, SelectionSetNode, getNamedType, graphql, isEnumType, isInterfaceType, isListType, isObjectType, isScalarType, print } from 'graphql';
import { flatten, get, isArray, isEmpty, isPlainObject, set } from 'lodash';
import gql from 'graphql-tag';
interface LocalForageDbMethodsCore {
	getItem<T>(key: string, callback?: (err: any, value: T) => void): Promise<T>;

	setItem<T>(key: string, value: T, callback?: (err: any, value: T) => void): Promise<T>;

	removeItem(key: string, callback?: (err: any) => void): Promise<void>;

	clear(callback?: (err: any) => void): Promise<void>;

	length(callback?: (err: any, numberOfKeys: number) => void): Promise<number>;

	key(keyIndex: number, callback?: (err: any, key: string) => void): Promise<string>;

	keys(callback?: (err: any, keys: string[]) => void): Promise<string[]>;

	iterate<T, U>(iteratee: (value: T, key: string, iterationNumber: number) => U,
		callback?: (err: any, result: U) => void): Promise<U>;
}

export type GenericObject = { [key: string]: any };

export interface MergeConflictFunc {
	(sentData: any, remoteData: any): any;
}
export interface GeniePersitenceConfig {
	localClient: ApolloClient<any>;
	remoteClient?: ApolloClient<any>;
	localGenie: GraphQLGenie;
	localForageInstance?: LocalForageDbMethodsCore; // used to cache mutations that still need to go to the remote client,
	throwMergeConflict?: MergeConflictFunc;
}

const ID_FIELD: FieldNode = {
	kind: 'Field',
	name: {
		kind: 'Name',
		value: 'id',
	},
};

export class GeniePersitence {
	public localClient: ApolloClient<any>;
	public remoteClient: ApolloClient<any>;
	public localGenie: GraphQLGenie;
	private persistStorage: LocalForageDbMethodsCore;
	private remoteQueue: PQueue;
	private localQueue: PQueue;
	private currStoreIndex: number;
	private idDocumentCache = new WeakMap<DocumentNode, DocumentNode>();
	public persisting = false;
	private dataIdFromObject: any;
	private throwMergeConflict: MergeConflictFunc;
	constructor(options: GeniePersitenceConfig) {
		this.remoteQueue = new PQueue({ concurrency: 1, autoStart: false });
		this.localQueue = new PQueue({ concurrency: 1 });
		this.localClient = options.localClient;
		this.remoteClient = options.remoteClient;
		this.localGenie = options.localGenie;
		this.persistStorage = options.localForageInstance;
		this.currStoreIndex = 0;
		this.dataIdFromObject = get(this.localClient, 'cache.config.dataIdFromObject');
		this.throwMergeConflict = options.throwMergeConflict || this.defaultThrowMergeConflict;
		if (!this.localGenie || !this.localClient) {
			throw new Error('must provide genie and local client to Genie Persistence');
		}

	}

	private async iterate(iteratee: (value: string, key: string, iterationNumber: number) => any) {
		if (this.persistStorage) {
			return await this.persistStorage.iterate(iteratee);
		} else {
			const iterateePromises = [];
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				const value = localStorage.getItem(key);
				iterateePromises.push(iteratee(
					value,
					key,
					i
				));
			}
			await Promise.all(iterateePromises);
		}
	}

	// private async getItem(key: string): Promise<any> {
	// 	if (this.persistStorage) {
	// 		return await this.persistStorage.getItem(key);
	// 	} else {
	// 		return localStorage.getItem(key);
	// 	}
	// }

	private async removeItem(key: string): Promise<any> {
		if (this.persistStorage) {
			return await this.persistStorage.removeItem(key);
		} else {
			return localStorage.removeItem(key);
		}
	}

	private async setItem(key: string, value: string): Promise<any> {
		if (this.persistStorage) {
			return await this.persistStorage.setItem(key, value);
		} else {
			return localStorage.setItem(key, value);
		}
	}

	// manually set off the setup and resolving queue from cache
	// recommend calling this when remoteClient is setup (using constructor or assignment)
	// otherwise it will be called the next query/mutate after the remote client is done
	public async persist() {
		if (this.remoteClient && !this.persisting) {
			const loadFromStorageQ = new PQueue({ concurrency: 1, autoStart: false });
			let cachedMutations: { key: string, options: MutationOptions<{}, OperationVariables> }[] = [];
			await this.iterate((value, key) => {
				if (this.localGenie.getDataResolver().getTypeFromId(key) === 'q') {
					cachedMutations.push({ key, options: this.objifyMutationOptions(value) });
				}
			});
			cachedMutations = cachedMutations.sort((a, b) => {
				return a.options.context.order - b.options.context.order;
			});
			cachedMutations.forEach(mutation => {
				this.addToRemoteQueue(mutation.options, mutation.key, loadFromStorageQ);
			});
			cachedMutations = null;

			loadFromStorageQ.start();
			if (navigator.onLine) {
				this.remoteQueue.start();
			}

			await this.setupHooks();
			// lets make sure any browser stored queue is done
			await loadFromStorageQ.onIdle();

			window.addEventListener('offline', () => {
				this.remoteQueue.pause();
			});

			window.addEventListener('online', () => {
				this.remoteQueue.start();
			});
			this.persisting = true;
		}
	}

	public startRemoteQueue() {
		this.remoteQueue.start();
	}

	public async setupHooks() {
		if (this.remoteClient && !this.persisting) {

			const userTypes = await this.localGenie.getUserTypes();
			// make sure changes to local that don't make server get queued
			userTypes.forEach(typeName => {
				this.localGenie.getDataResolver().addOutputHook(typeName, (context, record) => {
					if (get(context, 'request.meta.context.importData', false)) {
						const options: MutationOptions = get(context, 'request.meta.context.options');
						switch (context.request.method) {
							case 'create':
							case 'update':
								let previousValues = {};
								let data: GenericObject = {};
								const updatedFields: string[] = [];

								if (context.request.method === 'update') {
									data.id = record.id;
									data.__typename = record.__typename;
									const payload = get(context, 'request.payload[0]', {});
									const sym = Object.getOwnPropertySymbols(payload).find(function (s) {
										return String(s) === 'Symbol(updateRecord)';
									});
									previousValues = payload[sym];
									const update = context.request.payload[0];
									if (typeof update.pull === 'object') {
										updatedFields.push(...Object.keys(update.pull));
									}
									if (typeof update.push === 'object') {
										updatedFields.push(...Object.keys(update.push));
									}
									if (typeof update.replace === 'object') {
										updatedFields.push(...Object.keys(update.replace));
									}

									updatedFields.forEach(fieldName => {
										data[fieldName] = record[fieldName];
									});

								} else {
									data = record;
								}
								let conditions: { match: GenericObject };
								if (!isEmpty(previousValues)) {
									conditions = { match: {} };
									for (const fieldName in previousValues) {
										if (fieldName !== 'id'
											&& !fieldName.startsWith('__')
											&& previousValues.hasOwnProperty(fieldName)
											&& updatedFields.includes(fieldName)) {

											const element = previousValues[fieldName];
											if (!isArray(element) || (!isEmpty(element) && isArray(element))) {
												conditions.match[fieldName] = element;
											}
										}
									}
								}
								console.log('importDataToRemote :', record);
								console.log('previousValues :', previousValues);
								console.log('conditions :', conditions);

								// write cache data
								if (!options || !options.fetchPolicy || options.fetchPolicy !== 'no-cache') {
									this.localClient.writeData({
										id: this.dataIdFromObject ? this.dataIdFromObject(record) : undefined,
										data: record
									});
								}
								// const dataString = JSON.stringify(record).replace(/\"([^(\")"]+)\":/g, '$1:');  // This will remove all the quotes around props

								// importData(data: [JSON]!merge: BooleandefaultTypename: String conditions: ConditionsInput): ImportDataPayload

								const importData = gql`mutation importData($data: [JSON]!, $merge: Boolean, $defaultTypename: String, $conditions: ConditionsInput) {
									importData(data: $data, merge: $merge, defaultTypename: $defaultTypename, conditions: $conditions) {
										data
										unalteredData
										missingData
									}
								}`;

								options.mutation = importData;
								options.variables = {
									data,
									merge: true,
									conditions
								};
								this.addToRemoteQueue(options, undefined, this.remoteQueue, data);
								return record;
							case 'delete':
								options.mutation = gql`mutation {
									delete${record.__typename}(input: {
										where: {
											id: "${record.id}"
										}
									}) {
										clientMutationId
									}
								}`;
								this.addToRemoteQueue(options);
						}
					}
				});
			});

			const queryFields = this.localGenie.getSchema().getQueryType().getFields();
			Object.keys(queryFields).forEach(fieldName => {
				const field = queryFields[fieldName];
				// want the multiple type
				if (isListType(field.type)) {
					// only if it's a user type query
					const fieldType = getNamedType(field.type);
					if (isObjectType(fieldType) && userTypes.includes(fieldType.name)) {
						const scalarFields = [];
						const fields = fieldType.getFields();
						Object.keys(fields).forEach(fieldName => {
							const currType = getNamedType(fields[fieldName].type);
							if (isScalarType(currType) || isEnumType(currType)) {
								scalarFields.push(fieldName);
							}
						});

						this.remoteClient.cache.watch({
							callback: newData => {
								if (newData.result) {
									let data = <any[]>flatten(Object.values(newData.result));
									data = data.filter(element => element && element.id);
									if (!isEmpty(data)) {
										console.log('importDataToLocal :', data);
										this.localQueue.add(async () => await this.localGenie.importRawData(data, true, fieldType.name));
									}
								}
								console.log('newData :', newData);
							},
							optimistic: false,
							query: gql`
								query {
									${field.name} {
										${scalarFields}
									}
								}
							`
						});
					}
				}
			});
		}

	}

	private isDeepEmpty(obj): boolean {
		let isObjEmpty = true;
		const keys = Object.keys(obj);
		for (let i = 0; i < keys.length; i++) {
			const currVal = obj[keys[i]];
			if (!isEmpty(currVal)) {
				if (isPlainObject(currVal)) {
					const recurseEmpty = this.isDeepEmpty(currVal);
					if (!recurseEmpty) {
						isObjEmpty = false;
						break;
					}
				} else {
					isObjEmpty = false;
					break;
				}
			}
		}

		return isObjEmpty;
	}

	public async query<T, TVariables = OperationVariables>(
		remoteOptions: QueryOptions<TVariables>,
		localOptions?: QueryOptions<TVariables>,
		localFirst = false
	): Promise<ApolloQueryResult<T>> {
		await this.persist();

		// we need the remote request to cache in order to update the local client
		if (remoteOptions.fetchPolicy === 'no-cache') {
			remoteOptions.fetchPolicy = 'network-only';
		}

		remoteOptions.query = this.transformDocument(remoteOptions.query);

		if (localOptions && localOptions.query) {
			localOptions.query = this.transformDocument(localOptions.query);
		} else if (localOptions) {
			localOptions.query = remoteOptions.query;
		} else {
			localOptions = remoteOptions;
		}

		let result: ApolloQueryResult<any>;
		remoteOptions.query = this.transformDocument(remoteOptions.query);

		// tslint:disable-next-line:prefer-conditional-expression
		if (navigator.onLine && this.remoteClient) {
			try {

				if (localFirst) {
					result = await this.localClient.query(localOptions);
					let hasResults = false;
					if (result && result.data) {
						hasResults = !this.isDeepEmpty(result.data);
					}
					if (!hasResults) {
						result = null;
					}
				}

				if (!result) {
					result = await this.remoteClient.query(remoteOptions);
				}
				if (this.remoteQueue.size > 0) {
					this.remoteQueue.start();
				}
			} catch (e) {
				this.remoteQueue.pause();
				result = await this.localClient.query(localOptions);
			}
		} else {
			result = await this.localClient.query(localOptions);
		}

		return result;
	}

	private async onlineMutate<T, TVariables = OperationVariables>(
		remoteOptions: MutationOptions<T, TVariables>,
	): Promise<FetchResult<T>> {
		const result = await this.remoteClient.mutate(remoteOptions);
		if (this.remoteQueue.size > 0) {
			this.remoteQueue.start();
		}
		return result;
	}

	private async offlineMutate<T, TVariables = OperationVariables>(
		localOptions: MutationOptions<T, TVariables>,
	): Promise<FetchResult<T>> {
		this.remoteQueue.pause();
		set(localOptions, 'context.contextValue.importData', true);
		// we need to make sure the importData context is sent
		return await graphql(this.localGenie.getSchema(), print(localOptions.mutation), null, { importData: true, options: localOptions }, localOptions.variables);
	}

	public async mutate<T, TVariables = OperationVariables>(
		remoteOptions: MutationOptions<T, TVariables>,
		localOptions?: MutationOptions<T, TVariables>
	): Promise<FetchResult<T>> {

		await this.persist();

		// we need the remote request to cache in order to update the local client
		if (remoteOptions.fetchPolicy === 'no-cache') {
			remoteOptions.fetchPolicy = 'network-only';
		}

		if (localOptions && localOptions.mutation) {
			localOptions.mutation = this.transformDocument(localOptions.mutation, true);
		} else if (localOptions) {
			localOptions.mutation = remoteOptions.mutation;
		} else {
			localOptions = remoteOptions;
		}

		let result: FetchResult<T>;

		remoteOptions.mutation = this.transformDocument(remoteOptions.mutation, true);

		if (navigator.onLine && this.remoteClient) {
			try {
				result = await this.onlineMutate(remoteOptions);
			} catch (e) {
				this.remoteQueue.pause();
				result = await this.offlineMutate(remoteOptions);
			}
		} else {
			result = await this.offlineMutate(remoteOptions);
		}

		return result;
	}

	private async addToRemoteQueue<T, TVariables = OperationVariables>(
		options: MutationOptions<T, TVariables>,
		id?: string,
		startingQueue?,
		sentData?
	) {
		if (!id) {
			id = this.localGenie.getDataResolver().computeId('q');
			await this.setItem(id, this.stringifyMutationOptions(options));
		}
		if (!startingQueue) {
			startingQueue = this.remoteQueue;
		}
		startingQueue.add(async () => {
			try {
				await this.removeItem(id);
				const mutationResult = await this.remoteClient.mutate(options);
				if (sentData && mutationResult && mutationResult.data && mutationResult.data.importData) {
					if (!isEmpty(mutationResult.data.importData.unalteredData)) {
						const remoteData = mutationResult.data.importData.unalteredData;
						let isMergeConflict = false;
						const dataId = this.dataIdFromObject(sentData);
						const localCache = this.localClient.cache.readFragment({
							id: dataId,
							fragment: gql`
								fragment cacheData on ${sentData.__typename} {
									${Object.keys(sentData)}
								}
							`
						});

						// if the server data is up to date with the sent data
						for (const fieldName in sentData) {
							if (!isEqual(sentData[fieldName], remoteData[fieldName])) {
								isMergeConflict = true;
								break;
							}
						}

						// if the server is actually up to date with the client
						if (isMergeConflict && localCache) {
							isMergeConflict = false;
							for (const fieldName in sentData) {
								if (!isEqual(remoteData[fieldName], localCache[fieldName])) {
									isMergeConflict = true;
									break;
								}
							}
						}
						if (isMergeConflict) {
							this.throwMergeConflict(sentData, remoteData);
						}
					}
				}
			} catch (e) {
				console.error(e);
				this.remoteQueue.pause();
				await this.addToRemoteQueue(options, id, this.remoteQueue, sentData);
			}
		});
	}

	private transformDocument(document: DocumentNode, isMutation = false): DocumentNode {
		let result = this.idDocumentCache.get(document);
		if (!result) {
			this.idDocumentCache.set(
				document,
				(result = this.addIdToDocument(document, isMutation)),
			);
		}
		return result;
	}

	private addIdToDocument(doc: DocumentNode, isMutation: boolean) {
		checkDocument(doc);
		const docClone = cloneDeep(doc);

		docClone.definitions.forEach((definition: DefinitionNode) => {
			const isRoot = definition.kind === 'OperationDefinition';
			this.addIdToSelectionSet(
				(definition as OperationDefinitionNode).selectionSet,
				isRoot,
				isMutation
			);
		});
		return docClone;
	}

	private addIdToSelectionSet(
		selectionSet: SelectionSetNode,
		isRoot = false,
		isMutation = false,
		fieldType?: GraphQLNamedType
	) {
		if (selectionSet.selections) {
			if (!isRoot) {
				let addIdToSelectionSet = true;
				if (isObjectType(fieldType) || isInterfaceType(fieldType)) {
					if (!fieldType.getFields().id) {
						addIdToSelectionSet = false;
					}
				}
				const alreadyHasThisField = selectionSet.selections.some(selection => {
					return (
						selection.kind === 'Field' &&
						(selection as FieldNode).name.value === 'id'
					);
				});

				if (!alreadyHasThisField && addIdToSelectionSet) {
					console.log('selectionSet.selections :', selectionSet.selections);
					selectionSet.selections['push'](ID_FIELD);
				}
			}

			selectionSet.selections.forEach(selection => {
				let currFieldType = fieldType;
				if (selection.kind === 'Field') {

					if (isRoot) {
						let type: GraphQLObjectType;
						type = isMutation ? this.localGenie.getSchema().getMutationType() : this.localGenie.getSchema().getQueryType();
						const field = type.getFields()[selection.name.value];
						if (field) {
							currFieldType = getNamedType(field.type);
						}
					} else if (fieldType) {
						if (isObjectType(fieldType) || isInterfaceType(fieldType)) {
							const field = fieldType.getFields()[selection.name.value];
							if (field) {
								currFieldType = getNamedType(field.type);
							}
						}
					}

					// Must not add id if we're inside an introspection query
					if (
						selection.name.value.lastIndexOf('__', 0) !== 0 &&
						selection.selectionSet
					) {
						this.addIdToSelectionSet(selection.selectionSet, false, isMutation, currFieldType);
					}
				} else if (selection.kind === 'InlineFragment') {
					if (selection.selectionSet) {
						this.addIdToSelectionSet(selection.selectionSet, false, isMutation, currFieldType);
					}
				}
			});
		}
	}

	private stringifyMutationOptions<T, TVariables = OperationVariables>(options: MutationOptions<T, TVariables>): string {
		// make the mutation a string so it's smaller
		options.mutation = <any>print(options.mutation);
		set(options, 'context.order', this.currStoreIndex);
		this.currStoreIndex++;
		return JSON.stringify(options);
	}

	private objifyMutationOptions<T, TVariables = OperationVariables>(options: string): MutationOptions<T, TVariables> {
		// make the mutation a string so it's smaller
		const optionsObj = JSON.parse(options);

		optionsObj.mutation = gql(optionsObj.mutation);

		return optionsObj;
	}

	private defaultThrowMergeConflict(sentData, remoteData) {
		console.warn('Merge conflict', sentData, remoteData);
	}

}
