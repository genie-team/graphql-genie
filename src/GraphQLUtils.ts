import { GraphQLError, isListType, isNonNullType } from 'graphql';

export const typeIsList = (type) => {
	let isList = false;
	if (type.name && type.name.endsWith('Connection')) {
		isList = true;
	}
	while (!isList && (isListType(type) || isNonNullType(type) || type.kind === 'NON_NULL' || type.kind === 'LIST')) {
		if (isListType(type) || type.kind === 'LIST') {
			isList = true;
			break;
		}
		type = type.ofType;
	}
	return isList;
};

export const getReturnType = (type): string => {
	if (isListType(type) || isNonNullType(type) || type.kind === 'NON_NULL' || type.kind === 'LIST') {
		return getReturnType(type.ofType);
	} else {
		return type.name;
	}
};

export class FindByUniqueError extends Error implements GraphQLError {
	public extensions: Record<string, any>;
	readonly name;
	readonly locations;
	readonly path;
	readonly source;
	readonly positions;
	readonly nodes;
	readonly arg;
	readonly typename;
	public originalError;

	[key: string]: any;

	constructor(
		message: string,
		code?: string,
		properties?: Record<string, any>,
	) {
		super(message);

		if (properties) {
			Object.keys(properties).forEach(key => {
				this[key] = properties[key];
			});
		}

		// if no name provided, use the default. defineProperty ensures that it stays non-enumerable
		if (!this.name) {
			Object.defineProperty(this, 'name', { value: 'ApolloError' });
		}

		// extensions are flattened to be included in the root of GraphQLError's, so
		// don't add properties to extensions
		this.extensions = { code };
	}
}
