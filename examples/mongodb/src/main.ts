import { InMemoryCache, IntrospectionFragmentMatcher, IntrospectionResultData } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { SchemaLink } from 'apollo-link-schema';
import mongodbAdapter from 'fortune-mongodb';
import { execute, subscribe } from 'graphql';
import { FortuneOptions, GraphQLGenie } from 'graphql-genie';
import subscriptionPlugin from 'graphql-genie-subscriptions';
import { PubSub } from 'graphql-subscriptions';
import gql from 'graphql-tag';
import config from './config.json';

const typeDefs = `

interface Submission {
	id: ID! @unique
	title: String!
	text: String
}

type Post implements Submission {
  id: ID! @unique
	title: String!
	text: String
  author: User @relation(name: "WrittenSubmissions")
	likedBy: [User!] @relation(name: "LikedPosts") @connection
	comments: [Comment] @relation(name: "CommentsOnPost")
	published: Boolean @default(value: "true")
}

type Comment implements Submission {
  id: ID! @unique
	title: String!
	text: String
  author: User @relation(name: "WrittenSubmissions")
	post: Post @relation(name: "CommentsOnPost")
	approved: Boolean @default(value: "true")
}


type User {
	id: ID! @unique
	email: String! @unique
  name : String!
  address: Address
	writtenSubmissions: [Submission] @relation(name: "WrittenSubmissions")
	age: Int
	birthday: Date
	likedPosts: [Post!] @relation(name: "LikedPosts") @connection
	family: [User]
	match: User
	orderBy: String
	starred: [Star]
}

type Address {
  id: ID! @unique
  city: String!
  user: User
}

union Star = Address | User | Comment | Post


`;

const fortuneOptions: FortuneOptions = {
	adapter: [
		mongodbAdapter,
		{
			// options object, URL is mandatory.
			url: config.mongodbURL
		}
	],
	settings: { enforceLinks: true }
};
const start = Date.now();
console.log('GraphQL Genie Started');
const genie = new GraphQLGenie({ typeDefs, fortuneOptions, generatorOptions: {
	generateGetAll: true,
	generateCreate: true,
	generateUpdate: true,
	generateDelete: true,
	generateUpsert: true
}});
const buildClient = async (genie: GraphQLGenie) => {
	await genie.init();
	await genie.use(subscriptionPlugin(new PubSub()));
	const schema = genie.getSchema();
	console.log('GraphQL Genie Completed', Date.now() - start);
	const introspectionQueryResultData = <IntrospectionResultData>await genie.getFragmentTypes();
	const fragmentMatcher = new IntrospectionFragmentMatcher({
		introspectionQueryResultData
	});
	const client = new ApolloClient({
		link: new SchemaLink({ schema: schema }),
		cache: new InMemoryCache({fragmentMatcher}),
		connectToDevTools: true
	});
	client.initQueryManager();
	console.log('built client');
	let hasData;
	try {
		hasData = await client.query({
			query: gql`{
				users {
					name
				}
			}`
		});
	} catch (e) {
		console.error('could not query db', e);
	}

	console.log('current data:');
	console.log(JSON.stringify(hasData));

	if (hasData.data['users']) {
		console.log('Deleting existing data');
		await client.mutate({
			mutation: gql`
				mutation { deleteManyUsers (
					input: {
						where: {
							exists: {
								id: true
							}
						}
					}
				) {
					count
				}
				}
			`
		});
		await client.mutate({
			mutation: gql`
				mutation { deleteManyAddresses (
					input: {
						where: {
							exists: {
								id: true
							}
						}
					}
				) {
					count
				}
				}
			`
		});
		await client.mutate({
			mutation: gql`
				mutation { deleteManyPosts (
					input: {
						where: {
							exists: {
								id: true
							}
						}
					}
				) {
					count
				}
				}
			`
		});
		await client.mutate({
			mutation: gql`
			mutation { deleteManyComments (
					input: {
						where: {
							exists: {
								id: true
							}
						}
					}
				) {
					count
				}
			}
			`
		});
	}
	const zeus = await client.mutate({
		mutation: gql`
		mutation {
			createUser(
				input: {
					data: {
						age: 42
						birthday: "2000-02-02"
						email: "zeus@example.com"
						name: "Zeus"
						writtenSubmissions: {
							posts: {
								create: [{
									title: "Z Hello World"
									text: "This is my first blog post ever!"
								}, {
									title: "My Second Post"
									text: "My first post was good, but this one is better!"
								}, {
									title: "Solving World Hunger"
									text: "This is a draft..."
								}]
							}
						}
					}
					clientMutationId: "Test"
				}
			) {
				data {
					id
					name
					writtenSubmissions {
						id
						title
					}
				}
				clientMutationId
			}
		}
		`
	});

	console.log(zeus);

	const addPost = await client.mutate({
		mutation: gql`mutation {
			createPost(
				input: {
					data: {
						title: "Genie is great"
						text: "Look how fast I can create an executable schema"
						author: {
							connect:{
								email: "zeus@example.com"
							}
						}
					}
				}
			) {
				data {
					id
					author {
						email
					}
				}
			}
		}
		`
	});
	console.log(addPost);

	const addAddress = await client.mutate({
		mutation: gql`mutation {
			updateUser(
				input: {
					data: {
						age: 43
						address: {
							create: {
								city: "Olympus"
							}
						}
					}
					where: {
						email: "zeus@example.com"
					}
				}
			) {
				data {
					id
					name
					age
					address {
						city
						user {
							name
						}
					}
				}
			}
		}
		`
	});
	console.log(addAddress);

	const disconnectAddress = await client.mutate({
		mutation: gql`mutation {
			updateUser(
				input: {
					data: {
						address: {
							disconnect: true
						}
					}
					where: {
						email: "zeus@example.com"
					}
				}
			) {
				data {
					id
					name
					address {
						city
					}
				}
			}

		}
		`
	});
	console.log(disconnectAddress);

	const firstPostId = zeus.data.createUser.data.writtenSubmissions[0].id;
	const secondPostId = zeus.data.createUser.data.writtenSubmissions[1].id;
	const thirdPostId = zeus.data.createUser.data.writtenSubmissions[2].id;
	const updatePostOnUser = await client.mutate({
		mutation: gql`mutation {
			updateUser(
				input: {
					data: {
						age: 23
						writtenSubmissions: {
              posts: {
                update: [
                  {
                    data: {
                      title: "My Updated Post"
                    }
                    where: {
                      id: "${secondPostId}"
                    }
                  }
                ]
              }
            }
					}
					where: {
						email: "zeus@example.com"
					}
				}
			) {
				data {
					id
					name
					age
					writtenSubmissions {
            title
          }
				}
			}
		}
		`
	});
	console.log(updatePostOnUser);

	const upsertCreate = await client.mutate({
		mutation: gql`mutation {
			upsertUser(
				input: {
					create: {
            name: "Corey"
						email: "corey@genie.com"
					}
          update: {
            age: 30
          }
					where: {
						email: "corey@genie.com"
					}
				}
			) {
				data {
					id
					name
          email
					age
				}
			}
		}
		`
	});
	console.log(upsertCreate);

	const upsertUpdate = await client.mutate({
		mutation: gql`mutation {
			upsertUser(
				input: {
					create: {
            name: "Corey"
						email: "corey@genie.com"
					}
          update: {
            age: 30
						birthday: "1988-02-23"
          }
					where: {
						email: "corey@genie.com"
					}
				}
			) {
				data {
					id
					name
          email
					age
				}
			}
		}
		`
	});
	console.log(upsertUpdate);

	const nestedUpsertCreate = await client.mutate({
		mutation: gql`mutation {
			updateUser(
				input: {
					data: {
						family: {
              upsert: [
                {
                  update: {
                    age: 5000
                  }
                  create: {
                    name: "Loki"
                    email: "loki@example.com"
                  }
                  where:{
                    email: "loki@example.com"
                  }
                }
              ]
            }
					}
					where: {
						email: "zeus@example.com"
					}
				}
			) {
				data {
					id
					name
					age
					family {
            name
            email
            age
          }
				}
			}
		}
		`
	});
	console.log(nestedUpsertCreate);

	const nestedUpsertUpdate = await client.mutate({
		mutation: gql`mutation {
			updateUser(
				input: {
					data: {
						family: {
              upsert: [
                {
                  update: {
                    age: 5000
										birthday: "1000-01-01"
                  }
                  create: {
                    name: "Loki"
                    email: "loki@example.com"
                  }
                  where:{
                    email: "loki@example.com"
                  }
                }
              ]
            }
					}
					where: {
						email: "zeus@example.com"
					}
				}
			) {
				data {
					id
					name
					age
					family {
            name
            email
            age
          }
				}
			}
		}
		`
	});
	console.log(nestedUpsertUpdate);

	const nestedUpsertCreateSingle = await client.mutate({
		mutation: gql`mutation {
			updateUser(
				input: {
					data: {
						address: {
              upsert: {
                create: {
                	city: "New York"
                }
                update: {
                  city: "Olympus"
                }
              }
            }
					}
					where: {
						email: "zeus@example.com"
					}
				}
			) {
				data {
					id
					name
					age
					address {
            id
            city
          }
				}
			}
		}
		`
	});
	console.log(nestedUpsertCreateSingle);

	const nestedUpsertUpdateSingle = await client.mutate({
		mutation: gql`mutation {
			updateUser(
				input: {
					data: {
						address: {
              upsert: {
                create: {
                	city: "New York"
                }
                update: {
                  city: "Olympus"
                }
              }
            }
					}
					where: {
						email: "zeus@example.com"
					}
				}
			) {
				data {
					id
					name
					age
					address {
            id
            city
          }
				}
			}
		}
		`
	});
	console.log(nestedUpsertUpdateSingle);

	const nestedUpdateSingle = await client.mutate({
		mutation: gql`mutation {
			updateUser(
				input: {
					data: {
						address: {
              update: {
                city: "ec"
              }
            }
					}
					where: {
						email: "zeus@example.com"
					}
				}
			) {
				data {
					id
					name
					age
					address {
            id
            city
          }
				}
			}
		}
		`
	});
	console.log(nestedUpdateSingle);

	const deleteUser = await client.mutate({
		mutation: gql`mutation {
			deleteUser(input: {
				where: {
					email: "corey@genie.com"
				}
			}) {
				data {
					id
					name
					email
				}
			}
		}
		`
	});
	console.log(deleteUser);

	const deleteAddressFromUser = await client.mutate({
		mutation: gql`mutation {
			updateUser(
				input: {
					data: {
						address: {
              delete: true
            }
					}
					where: {
						email: "zeus@example.com"
					}
				}
			) {
				data {
					id
					name
					age
					address {
            id
            city
          }
				}
			}
		}
		`
	});
	console.log(deleteAddressFromUser);

	const deletePostFromUser = await client.mutate({
		mutation: gql`mutation {
			updateUser(
				input: {
					data: {
						writtenSubmissions: {
              posts: {
                delete: [{    id: "${secondPostId}"}]
              }
            }
					}
					where: {
						email: "zeus@example.com"
					}
				}
			) {
				data {
					id
					name
					age
					writtenSubmissions {
            title
          }
				}
			}
		}
		`
	});
	console.log(deletePostFromUser);

	const createComment = gql`
	mutation createComment($input: CreatePostMutationInput!) {
		createComment(input: $input) {
			data {
				id
				title
				approved
				author {
					id
					name
					email
				}
			}
		}
	}
	`;
let result = await client.mutate({
	mutation: createComment,
	variables: { input: {data: { title: 'nice post', author: {connect: {email: 'zeus@example.com'}}}}}
});
console.log(result);

const createUser = gql`
mutation createUser($input: CreateUserMutationInput!) {
	createUser(input: $input) {
		data {
			name
		}
	}
}
`;

result = await client.mutate({
	mutation: createUser,
	variables: { input: {data: { name: 'Hela', email: 'hela@example.com', birthday: '1900-01-01'}}}
});

const updatePost = gql`
mutation updatePost($input: UpdatePostMutationInput!) {
	updatePost(input: $input) {
		data {
			title
		}
	}
}
`;
result = await client.mutate({
	mutation: updatePost,
	variables: { input: {
		data: { likedBy: { connect: [{email: 'loki@example.com'}, {email: 'hela@example.com'}, {email: 'zeus@example.com'}]}},
		where: { id: firstPostId}
	}}
});

// create some users
const newUsers = [];
result = await client.mutate({
	mutation: createUser,
	variables: { input: {data: {age: 6, birthday: '2012-02-02', name: 'Test 1', email: 'test1@example.com'}}}
});
newUsers.push(result.data.createUser.data);
result = await client.mutate({
	mutation: createUser,
	variables: { input: {data: {birthday: '2012-02-02', name: 'Test 2', email: 'test2@example.com'}}}
});
newUsers.push(result.data.createUser.data);
result = await client.mutate({
	mutation: createUser,
	variables: { input: {data: { name: 'Test 3', email: 'test3@example.com'}}}
});
newUsers.push(result.data.createUser.data);
result = await client.mutate({
	mutation: createUser,
	variables: { input: {data: { name: 'Test 4', email: 'test4@example.com'}}}
});
newUsers.push(result.data.createUser.data);
result = await client.mutate({
	mutation: createUser,
	variables: { input: {data: { name: 'Test 4', email: 'test5@example.com'}}}
});
newUsers.push(result.data.createUser.data);
console.log('subscribe main');
// const sub: AsyncIterator<any> = <AsyncIterator<any>> await subscribe(schema,
// 	gql`subscription {
// 		post (where: {
// 			mutation_in: [UPDATED],
// 			updatedFields_contains: ["likedBy", "title"],
// 			node: {exists: {title: true}}}){
// 			mutation
// 			node {
// 				title
// 			}
// 		}
// 	}
// 	`
// );

// const sub: AsyncIterator<any> = <AsyncIterator<any>> await subscribe(schema,
// 	gql`subscription {
// 		post (where: {
// 			mutation_in: [UPDATED],
// 			updatedFields_contains: ["likedBy", "title"],
// 			node: {author: {
//         match: {
//           email: ["zeu@example.com"]
//         }
//       }}
//       }){
// 			mutation
// 			node {
// 				title
// 			}
// 		}
// 	}
// 	`
// );

const sub: AsyncIterator<any> = <AsyncIterator<any>> await subscribe(schema,
	gql`subscription {
		post(where: {
			AND: [
				{mutation_in: [UPDATED]},
				{updatedFields_contains: ["likedBy", "title"]},
				{node: {
					author: {
						match: {
							email: ["zeus@example.com"]
						}
					}
				}
				}
			]
		}) {
			mutation
			node {
				title
				likedBy {
					edges {
            node {
              name
            }
          }
				}
			}
			updatedFields
			previousValues {
				title
				likedBy_ids
			}
		}
	}

	`
);

const exe = await execute(schema, gql`mutation {
  createPost(input: {data:{title:"bam"}}) {
    data {
      title
    }
  }
}`);
console.log(exe);

result = await client.mutate({
	mutation: updatePost,
	variables: { input: {
		data: { likedBy: { connect: [{email: 'hela@example.com'}, {email: 'zeus@example.com'}]}},
		where: { id: thirdPostId}
	}}
});
console.log((await sub.next()).value.data.post);

};

buildClient(genie);
