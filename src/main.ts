import { InMemoryCache, IntrospectionFragmentMatcher, IntrospectionResultData } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { SchemaLink } from 'apollo-link-schema';
import gql from 'graphql-tag';
import { GraphQLGenie } from './index';
import subscriptionPlugin from './subscriptionPlugin/subscriptions';

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
}

type Address {
  id: ID! @unique
  city: String!
  user: User
}

`;

const fortuneOptions = { settings: { enforceLinks: true } };
const start = Date.now();
console.log('GraphQL Genie Started');
const genie = new GraphQLGenie({ typeDefs, fortuneOptions, generatorOptions: {
	generateGetAll: true,
	generateCreate: true,
	generateUpdate: true,
	generateDelete: true,
	generateUpsert: true,
	generateSubscriptions: false
}});
const buildClient = async (genie: GraphQLGenie) => {
	genie.use(subscriptionPlugin());
	await genie.init();
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
	window['fortune'] = genie.getDataResolver();
	window['store'] = window['fortune'].getStore();
	window['schema'] = schema;
	window['client'] = client;
	const zeus = await client.mutate({
		mutation: gql`
		mutation {
			createUser(
				input: {
					data: {
						age: 42
						email: "zeus@example.com"
						name: "Zeus"
						writtenSubmissions: {
							posts: {
								create: [{
									title: "Hello World"
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
	variables: { input: {data: { name: 'Hela', email: 'hela@example.com'}}}
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

result = await client.mutate({
	mutation: updatePost,
	variables: { input: {
		data: { likedBy: { connect: [{email: 'hela@example.com'}, {email: 'zeus@example.com'}]}},
		where: { id: thirdPostId}
	}}
});

// create some users
const newUsers = [];
result = await client.mutate({
	mutation: createUser,
	variables: { input: {data: { name: 'Test 1', email: 'test1@example.com'}}}
});
newUsers.push(result.data.createUser.data);
result = await client.mutate({
	mutation: createUser,
	variables: { input: {data: { name: 'Test 2', email: 'test2@example.com'}}}
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

// {
// 	posts(orderBy: {
//     title: ASC
// }){
//     title
//     author {
//       name
//       writtenSubmissions (orderBy: {title: DESC}) {
//         title
//       }
//     }
//   }
// }

// mutation {
//   updateManyUsers(input: {
//     filter: {
//       exists: {
//         age: false
//       }
//     }
//     data: {
//       age: 12
//     }
//   }) {
//     count
//   }
// }

// mutation {
//   deleteManyUsers(input: {
//     filter: {
//       match: {
//         age: 12
//       }
//     }
//   }) {
//     count
//   }
// }

// {
// 	posts(orderBy: {author: {writtenSubmissions: {title: DESCENDING}}}){
//     title
//     author {
//       name
//       writtenSubmissions {
//         title
//       }
//     }
//   }
// }

// {
// 	posts(orderBy: {
//     title: ASCENDING
//     author: {writtenSubmissions: {title: DESCENDING}}}){
//     title
//     author {
//       name
//       writtenSubmissions {
//         title
//       }
//     }
//   }
// }

// mutation {
	// 	createUser(
	// 		input: {
	// 			data: {
	// 				age: 42
	// 				email: "zeus@example.com"
	// 				name: "Zeus"
	// 			}
	// 			clientMutationId: "Test"
	// 		}
	// 	) {
	// 		data {
	// 			id
	// 			name
	// 		}
	// 		clientMutationId
	// 	}
	// }

	// mutation {
	// 	createPost(
	// 		input: {
	// 			data: {
	// 				title: "should not create"
	// 				author: {
	// 					create: {
	// 						name: "zeus"
	// 						email: "zeus@example.com"
	// 					}
	// 				}
	// 			}
	// 			clientMutationId: "Test"
	// 		}
	// 	) {
	// 		data {
	// 			id
	// 			title
	// 		}
	// 		clientMutationId
	// 	}
	// }

// let createPost = gql`
// 	mutation createPost($title: String!) {
// 		createPost(title: $title) {
// 			id
// 		}
// 	}
// `;

// const createUser = gql`
// mutation createUser($name: String!, $age: Int, $birthday: Date) {
// 	createUser(name: $name, age: $age, birthday: $birthday) {
// 		id
// 	}
// }
// `;

// const createAddress = gql`
// mutation createAddress($city: String!) {
// 	createAddress(city: $city) {
// 		id
// 	}
// }
// `;
// 	const post = await client.mutate({
// 		mutation: createPost,
// 		variables: { title: 'bam post' }
// 	});
// 	const user = await client.mutate({
// 		mutation: createUser,
// 		variables: { name: 'Corey', age: 30, birthday: '1988-02-23' }
// 	});
// 	const address = await client.mutate({
// 		mutation: createAddress,
// 		variables: { city: 'Eau Claire' }
// 	});
// 	const testData = {users: [user.data.createUser],
// 		posts: [post.data.createPost],
// 		addresses: [address.data.createAddress],
// 	comments: []};
// 	console.log('post', testData.posts[0].id,
// 	'user', user.data.createUser.id,
// 	'address', address.data.createAddress.id);
// 	const user2 = await client.mutate({
// 		mutation: createUser,
// 		variables: { name: 'Zain', age: 22, birthday: '1996-01-22' }
// 	});
// 	testData.users.push(user2.data.createUser);

// 	const user3 = await client.mutate({
// 		mutation: createUser,
// 		variables: { name: 'Steve', age: 26, birthday: '1992-06-02' }
// 	});
// 	testData.users.push(user3.data.createUser);

// 	const setUserAddress = gql`
// 	mutation setUserAddress($addressAddressId: ID!, $userUserId: ID!) {
// 		setUserAddress(addressAddressId: $addressAddressId, userUserId: $userUserId	) {
// 			addressAddress {
// 				id
// 				city
// 				user {
// 					name
// 				}
// 			}
// 			userUser {
// 				id
// 				name
// 				address {
// 					city
// 				}
// 			}
// 		}
// 	}
// 	`;
// 	let result = await client.mutate({
// 		mutation: setUserAddress,
// 		variables: { userUserId: testData.users[0].id, addressAddressId: testData.addresses[0].id}
// 	});
// 	console.log(result);

// 	const title = 'Genie is great';
// 	createPost = gql`
// 		mutation createPost($title: String!, $authorId: ID) {
// 			createPost(title: $title, authorId: $authorId) {
// 				id
// 				title
// 				author {
// 					id
// 					name
// 				}
// 			}
// 		}
// 		`;
// 	result = await client.mutate({
// 		mutation: createPost,
// 		variables: { title: title, authorId: testData.users[0].id}
// 	});
// 	testData.posts.push(result.data.createPost);

// 	const createComment = gql`
// 		mutation createComment($title: String!, $postId: ID!, $authorId: ID!, $text: String) {
// 			createComment(title: $title, postId: $postId, authorId: $authorId, text: $text) {
// 				id
// 				title
// 				author {
// 					id
// 					name
// 				}
// 			}
// 		}
// 		`;
// 	result = await client.mutate({
// 		mutation: createComment,
// 		variables: { title: title + ' Comment', postId: testData.posts[1].id, authorId: testData.users[1].id, text: 'Test Text'}
// 	});
// 	testData.comments.push(result.data.createPost);

// 	const fragment = gql`fragment user on User{
// 		name
// 		writtenSubmissions {
// 			id
// 			title
// 		}
// 	}`;
// 	const userWithFragment = gql`
// 		query User($id: ID!) {
// 			User(id: $id) {
// 				id
// 				address {
// 					id
// 					city
// 					user {
// 						...user
// 					}
// 				}
// 			}
// 		}
// 		${fragment}
// 		`;
// 	result = await client.query({
// 		query: userWithFragment,
// 		variables: { id: testData.users[0].id}
// 	});
// 	console.log(result.data);

// 	const unsetUserAddress = gql`
// 	mutation unsetUserAddress($addressAddressId: ID!, $userUserId: ID!) {
// 		unsetUserAddress(addressAddressId: $addressAddressId, userUserId: $userUserId	) {
// 			addressAddress {
// 				id
// 				city
// 				user {
// 					name
// 				}
// 			}
// 			userUser {
// 				id
// 				name
// 				address {
// 					city
// 				}
// 			}
// 		}
// 	}
// 	`;
// result = await client.mutate({
// 	mutation: unsetUserAddress,
// 	variables: { userUserId: testData.users[0].id, addressAddressId: testData.addresses[0].id}
// });
// console.log(result);

};

buildClient(genie);
