<h1 align="center">
	<img width="128px" src="https://raw.githubusercontent.com/genie-team/graphql-genie/master/resources/logo.svg?sanitize=true" alt="GraphQL Genie Logo">
</h1>

# GraphQL Genie Authentication

[![npm version](https://img.shields.io/npm/v/graphql-genie-authentication.svg)](https://www.npmjs.com/package/graphql-genie-authentication)
[![npm](https://img.shields.io/npm/l/graphql-genie-authentication.svg)](https://github.com/genie-team/graphql-genie/blob/master/LICENSE)

Pass in a pubsub object from [graphql-subscriptions](https://github.com/apollographql/graphql-subscriptions) and the necessary types and resolvers will be added to your schema

### Installation
Assuming you already have [GraphQL Genie](https://github.com/genie-team/graphql-genie) installed.

`npm install graphql-genie-authentication` 

or 

`yarn add graphql-genie-authentication`

### Enable plugin

```js
import { FortuneOptions, GraphQLGenie } from 'graphql-genie';
import authPlugin from 'graphql-genie-authentication';

const genie = new GraphQLGenie(...args);

await genie.init();
// genie.use can be called before or after init
await genie.use(authPlugin()); 

//get the GraphQLSchema and use it with any other tools you need, such as subscriptions-transport-ws
const schema = genie.getSchema();
```
### Arguments

(defaultCreateRole = 'ADMIN', defaultReadRole = 'ADMIN', defaultUpdateRole = 'ADMIN', defaultDeleteRole = 'ADMIN'): GeniePlugin

You can pass in the default required of each operation which will be used in you don't pass in the required role when using the directive


### Authentication Requirements

		
### Examples

All the graphql-yoga [code examples](https://github.com/genie-team/graphql-genie/blob/master/examples) use the subscriptions plugin.

The [tests](https://github.com/genie-team/graphql-genie/blob/master/plugins/subscriptions/tests/__tests__/subscriptions.ts) are a good place to see example subscription queries.

#### Thanks/Credit

Logo Icon made by [Freepik](http://www.freepik.com) from [www.flaticon.com](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)


Must have a Role ENUM

Context: Must pass in an authenticate function which returns true if the operation is allowed if the operation is not allowed either return false or throw an error. The function should also have any other constraint logic necessary, such as users not being able to create roles on themselves, or only set the author field on post to themselves
