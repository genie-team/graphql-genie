<h1 align="center">
	<img width="128px" src="https://raw.githubusercontent.com/genie-team/graphql-genie/master/resources/logo.svg?sanitize=true" alt="GraphQL Genie Logo">
</h1>

# GraphQL Genie

[![npm version](https://img.shields.io/npm/v/graphql-genie.svg)](https://www.npmjs.com/package/graphql-genie)
[![Dependency Status](https://david-dm.org/genie-team/graphql-genie.svg)](https://david-dm.org/genie-team/graphql-genie)
[![devDependency Status](https://david-dm.org/genie-team/graphql-genie/dev-status.svg)](https://david-dm.org/genie-team/graphql-genie/?type=dev)
[![npm](https://img.shields.io/npm/l/graphql-genie.svg)](https://github.com/genie-team/graphql-genie/blob/master/LICENSE)

Write a [GraphQL Type Schema](https://graphql.org/learn/schema/) and [GraphQL Genie](https://github.com/genie-team/graphql-genie) turns it into a fully featured GraphQL API with referential integrity and inverse updates that can be used client side or server side. You can use all the features of the type schema, including interfaces and unions. Add subscriptions with the [plugin](#subscriptions). The schema uses best practices and is compliant with the [Relay GraphQL Server Specification](https://facebook.github.io/relay/docs/en/graphql-server-specification.html#mutations). 

Because GraphQL Genie gives you a fully functioning schema but is not opinionated about anything else you have flexibility to use that schema wherever you want and integrate it was any existing services you use. For example you can use your existing [authentication](#authentication) methods or one provided by an outside service.

### Installation
Assuming you already have [GraphQL Genie](https://github.com/genie-team/graphql-genie) installed.

`npm install graphql-genie fortune graphql graphql-tools` or `yarn add graphql-genie fortune graphql graphql-tools`

### Getting started

Create your type defintions.

Genie will compute relations for referential integrity and inverse updates (like between User and Address below) but if the relation is ambiguous the @relation directive should be used
```graphql 

interface Submission {
	id: ID! @unique
	text: String!
	author: User @relation(name: "SubmissionsByUser")
}

type Story implements Submission {
	id: ID! @unique
	title: String!
	text: String!
	author: User @relation(name: "SubmissionsByUser")
	likedBy: [User]
}

type Comment implements Submission {
	id: ID! @unique
	text: String!
	author: User @relation(name: "SubmissionsByUser")
}

type User {
	id: ID! @unique
	email: String @unique
	submissions: [Submission!]! @relation(name: "SubmissionsByUser")
	address: Address
}

type Address {
	id: ID! @unique
	city: String!
	user: User
}


```

Setup fortune options (see fortune docs](http://fortune.js.org/api/#fortune-constructor) and then create the schema using genie.

```ts
import { FortuneOptions, GraphQLGenie } from 'graphql-genie';
import mongodbAdapter from 'fortune-mongodb';

//adapter: configuration array for the data store. The default type is the memory adapter. See below for other adapter options
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
// Instantiate Genie with your type defintions
const typeDefs = `[TYPEDEFS]`
const genie = new GraphQLGenie({ 
	typeDefs: typeDefs, 
	fortuneOptions: fortuneOptions, 
	generatorOptions: {
		generateGetAll: true,
		generateCreate: true,
		generateUpdate: true,
		generateDelete: true,
		generateUpsert: true
	}
});

// init genie, this sets up all the new types and resolvers, init returns a promise so use await or .then()
await genie.init();

// get the schema and use it with any other tools you want
const schema: GraphQLSchema = genie.getSchema();
```

### Data Store 

GraphQLGenie uses [FortuneJS](http://fortune.js.org) for accessing the data store. This means any [fortune adapter](http://fortune.js.org/plugins/) will work, plugins currently exist for memory ([example](https://github.com/genie-team/graphql-genie/tree/master/examples/memory)), [IndexedDB](https://github.com/fortunejs/fortune-indexeddb) ([example](https://github.com/genie-team/graphql-genie/tree/master/examples/indexeddb)), [MongoDB](https://github.com/fortunejs/fortune-mongodb) ([example](https://github.com/genie-team/graphql-genie/tree/master/examples/mongodb)), [Postgres](https://github.com/fortunejs/fortune-postgres) ([example](https://github.com/genie-team/graphql-genie/tree/master/examples/postgresql)), [Redis](https://github.com/thibremy/fortune-redis), [Google Cloud Datastore](https://github.com/patrinhani-ciandt/fortune-datastore), [NeDB](https://github.com/fortunejs/fortune-nedb) and [File System](https://github.com/fortunejs/fortune-fs). Or you could write your own.

### Subscriptions

[GraphQL Genie](https://github.com/genie-team/graphql-genie) also supports subscriptions with the [subscriptions plugin](https://github.com/genie-team/graphql-genie/tree/master/plugins/subscriptions). 


### Documentation

#### use(plugin: GeniePlugin): Promise\<Void\>

Pass in a plugin that alters the schema, see the [subscriptions plugin](https://github.com/genie-team/graphql-genie/tree/master/plugins/subscriptions) for an example

> See info about the GeniePlugin interface in [GraphQLGenieInterfaces.ts](https://github.com/genie-team/graphql-genie/blob/master/src/GraphQLGenieInterfaces.ts)

#### getSchema(): GraphQLSchema

Get the schema

#### printSchema(): string

Return a string of the full schema with directives


#### getFragmentTypes(): Promise\<Void\>
When using Apollo or another tool you may need to get information on the fragment types, genie provides a helper for this
```ts
import { IntrospectionFragmentMatcher, IntrospectionResultData } from 'apollo-cache-inmemory';
const introspectionQueryResultData = <IntrospectionResultData>await genie.getFragmentTypes();
const fragmentMatcher = new IntrospectionFragmentMatcher({
	introspectionQueryResultData
});
```


#### getDataResolver(): DataResolver
DataResolver handles all the operations with your actual data. Such as CRUD and hooks. 

Most likely use of this is to add hooks into the CRUD operations against your database. The DataResolver has 2 functions to add hooks. For more info on the context, record and update objects see the [fortune documentation](http://fortune.js.org/#input-and-output-hooks).

```ts
 interface DataResolverInputHook {
	(context?, record?, update?): any;
}
 interface DataResolverOutputHook {
	(context?, record?): any;
}
	addOutputHook(graphQLTypeName: string, hook: DataResolverOutputHook);
	addInputHook(graphQLTypeName: string, hook: DataResolverInputHook);
```

> See info about the DataResolver interface in [GraphQLGenieInterfaces.ts](https://github.com/genie-team/graphql-genie/blob/master/src/GraphQLGenieInterfaces.ts)

#### getSchemaBuilder(): GraphQLSchemaBuilder
GraphQLSchemaBuilder has some additional helpers to add types and resolvers to a graphql schema

> See info about the GraphQLSchemaBuilder interface in [GraphQLGenieInterfaces.ts](https://github.com/genie-team/graphql-genie/blob/master/src/GraphQLGenieInterfaces.ts)


Additional documentation is in development, see [examples](https://github.com/genie-team/graphql-genie/tree/master/examples) and [tests](https://github.com/genie-team/graphql-genie/tree/master/src/tests) for implementation examples.

### Authentication

Work is in progress on a plugin to make it extremely easy to add Authentication to a schema created with GraphQL Genie. There are a lot of ways to have some sort of authentication with a GraphQL API and Genie gives you the flexibility to do it any way you want or integrate into services such as Auth0 or Firebase.

Some options to add authentication
 * At the schema level using the [addSchemaLevelResolveFunction](https://www.apollographql.com/docs/graphql-tools/resolvers.html#addSchemaLevelResolveFunction) from graphql-tools
 * At the resolver level use a tool like [graphql-resolvers](https://github.com/lucasconstantino/graphql-resolvers) to combine  a resolver with authentication logic with the resolvers that GraphQL Genie created
 * At the data level create an input hook and add it to the DataResolver (returned by getDataResolver) and throw an error if not authorized 


### TODO

- [ ] Additional Documentation
- [ ] Authentication Example


#### Thanks/Credit

[Prisma GraphQL / Graphcool](https://github.com/prismagraphql/prisma) for inspiration

[FortuneJS](http://fortune.js.org) for CRUD adapters

Logo Icon made by [Freepik](http://www.freepik.com) from [www.flaticon.com](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)