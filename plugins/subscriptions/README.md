<h1 align="center">
	<img width="128px" src="https://raw.githubusercontent.com/genie-team/graphql-genie/master/resources/logo.svg?sanitize=true" alt="GraphQL Genie Logo">
</h1>

# GraphQL Genie Subscriptions

[![npm version](https://img.shields.io/npm/v/graphql-genie-subscriptions.svg)](https://www.npmjs.com/package/graphql-genie-subscriptions)
[![Dependency Status](https://david-dm.org/genie-team/graphql-genie-subscriptions.svg)](https://david-dm.org/genie-team/graphql-genie-subscriptions)
[![devDependency Status](https://david-dm.org/genie-team/graphql-genie-subscriptions/dev-status.svg)](https://david-dm.org/genie-team/graphql-genie-subscriptions/?type=dev)
[![npm](https://img.shields.io/npm/l/graphql-genie-subscriptions.svg)](https://github.com/genie-team/graphql-genie-subscriptions/blob/master/LICENSE)

Pass in a pubsub object from [graphql-subscriptions](https://github.com/apollographql/graphql-subscriptions) and the necessary types and resolvers will be added to your schema

### Installation
Assuming you already have [GraphQL Genie](https://github.com/genie-team/graphql-genie) installed.

`npm install graphql-genie-subscriptions graphql-subscriptions` or `yarn add graphql-genie-subscriptions graphql-subscriptions`


### Enable plugin

```js
import { FortuneOptions, GraphQLGenie } from 'graphql-genie';
import subscriptionPlugin from 'graphql-genie-subscriptions';
import { PubSub } from 'graphql-subscriptions';

const genie = new GraphQLGenie(...args);

await genie.init();
// genie.use can be called before or after init
await genie.use(subscriptionPlugin(new PubSub())); 

//get the GraphQLSchema and use it with any other tools you need, such as subscriptions-transport-ws
const schema = genie.getSchema();
```

### Subscription API

Given you passed the following schema to Graphql Genie

```graphql
type Post {
  id: ID! @unique
	title: String!
	text: String
  author: User @relation(name: "posts")
}

type User {
	id: ID! @unique
	displayname: String @unique
	email: String! @unique
  name : String 
	posts: [Post] @relation(name: "posts")
}
```

2 Subscriptions will be created, `user` and `post`.

Each will have a where input and a payload output

```graphql
user(
where: UserSubscriptionWhereInput
): UserSubscriptionPayload
```

The where input type looks like

```graphql
type UserSubscriptionWhereInput {
	AND: [UserSubscriptionWhereInput!]
	OR: [UserSubscriptionWhereInput!]
	mutation_in: [MutationType!]
	updatedFields_contains: [String!]
	updatedFields_contains_every: [String!]
	node: UserWhereInput
}
```
`MutationType` is CREATED, UPDATED or DELETED. 

	`updatedFields_contains`: Matches if any of the fields specified have been updated.
	`updatedFields_contains_every`: Matches if all fields specified have been updated.
	`node`: To select specific nodes that you want to be notified about. The WhereInput is the same one used in other Queries and Mutations for this node


The payload output looks like

```graphql
type UserSubscriptionPayload {
	mutation: MutationType!
	node: User
	updatedFields: [String!]
	previousValues: UserPreviousValues
}
```

    `mutation`: Which mutation happened
    `node:` Information on the mutated node.
		`updatedFields`: In case of an update, a list of the fields that changed.
		`previousValues`: In case of an update, previous values of the node. Scalars return the actual value but other output types return just the id(s)

		
```graphql
type UserPreviousValues {
	id: ID!
	displayname: String
	email: String!
	name: String
	posts_ids: [String!]
}
```
		
### Examples

All the graphql-yoga [code examples](https://github.com/genie-team/graphql-genie/blob/master/examples) use the subscriptions plugin.

The [tests](https://github.com/genie-team/graphql-genie/blob/master/plugins/subscriptions/tests/__tests__/subscriptions.ts) are a good place to see example subscription queries.

#### Thanks/Credit

Logo Icon made by [Freepik](http://www.freepik.com) from [www.flaticon.com](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)
