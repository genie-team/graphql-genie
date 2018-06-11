<h1 align="center">
	<img width="128px" src="https://raw.githubusercontent.com/genie-team/graphql-genie/master/resources/logo.svg?sanitize=true" alt="GraphQL Genie Logo">
</h1>

# GraphQL Genie

[![npm version](https://img.shields.io/npm/v/graphql-genie.svg)](https://www.npmjs.com/package/graphql-genie)
[![Dependency Status](https://david-dm.org/genie-team/graphql-genie.svg)](https://david-dm.org/genie-team/graphql-genie)
[![devDependency Status](https://david-dm.org/genie-team/graphql-genie/dev-status.svg)](https://david-dm.org/genie-team/graphql-genie/?type=dev)
[![npm](https://img.shields.io/npm/l/graphql-genie.svg)](https://github.com/genie-team/graphql-genie/blob/master/LICENSE)

Write a [GraphQL Type Schema](https://graphql.org/learn/schema/) and [GraphQL Genie](https://github.com/genie-team/graphql-genie) turns it into a fully featured GraphQL API with referential integrity and inverse updates that can be used client side or server side. You can use all the features of the type schema, including interfaces and unions. Add subscriptions with the [plugin](https://github.com/genie-team/graphql-genie/tree/master/plugins/subscriptions). The schema uses best practices and is compliant with the [Relay GraphQL Server Specification](https://facebook.github.io/relay/docs/en/graphql-server-specification.html#mutations). 

Because GraphQL Genie gives you a fully functioning schema but is not opinionated about anything else you have flexibility to use that schema wherever you want and integrate it was any existing services you use. You can use [The Apollo Platform](https://www.apollographql.com/), Relay (https://facebook.github.io/relay/) or any of the many other tools in the growing GraphQL ecosystem. You can use your existing [authentication](#authentication) methods or one provided by an outside service.

### Installation
Assuming you already have [GraphQL Genie](https://github.com/genie-team/graphql-genie) installed.

`npm install graphql-genie fortune graphql graphql-tools lodash` or `yarn add graphql-genie fortune graphql graphql-tools lodash`

### Getting started

#### Create your [type defintions](https://graphql.org/learn/schema/). 

#### GraphQL Genie has some custom directives you can use.
 * **@unique**
	* The @unique directive marks a scalar field as unique. All id fields will be considered marked @unique
	* This is used for various update operations that need to find a unique field, errors will be thrown if a duplicate value is attempted to be added on a unique field
	* Currently GraphQL Genie does not automatically add indexes to unique fields in your database and it is recommended that you do this manually to improve performance.
*  **@relation**
	*  The directive @relation(name: String) can be attached to a relation field
	*  Fields with relations will have referential integrity and inverse updates
	*  Genie will compute relations automatically (like between User and Address below) but if the relation is ambiguous the @relation directive should be used
	*  If a related object is delated, it's related nodes will be set to null
*  **@default**
	*  The directive @default(value: String!) sets a default value for a scalar field. 
	*  Note that the value argument is of type String for all scalar fields
*  **@connection**
	*  The directive @connection can be put on a list field to turn it into a type following the [Relay Cursor Connections Specification](https://facebook.github.io/relay/graphql/connections.htm) rather than just returning a normal list.


#### Scalar Types
	In addition to the [default scalar types](https://graphql.org/learn/schema/#scalar-types) (Int, Float, String, Boolean, ID) GraphQL Genie comes built in with scalar fields Date, Time, DateTime ([learn more](https://www.npmjs.com/package/graphql-iso-date)) and JSON ([learn more](https://github.com/taion/graphql-type-json)).

**Example:**
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
	likedBy: [User!] @connection @relation(name: "LikedSubmissions")
}

type Comment implements Submission {
	id: ID! @unique
	text: String!
	author: User @relation(name: "SubmissionsByUser")
	approved: Boolean @default(value: "true")
}

type User {
	id: ID! @unique
	email: String @unique
	submissions: [Submission!] @relation(name: "SubmissionsByUser")
	address: Address
	liked: [Submission!] @connection @relation(name: "LikedSubmissions")
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

#### GraphQLGenie.use(plugin: GeniePlugin): Promise\<Void\>

Pass in a plugin that alters the schema, see the [subscriptions plugin](https://github.com/genie-team/graphql-genie/tree/master/plugins/subscriptions) for an example

> See info about the GeniePlugin interface in [GraphQLGenieInterfaces.ts](https://github.com/genie-team/graphql-genie/blob/master/src/GraphQLGenieInterfaces.ts)

#### GraphQLGenie.getSchema(): GraphQLSchema

Get the schema

#### GraphQLGenie.printSchema(): string

Return a string of the full schema with directives


#### GraphQLGenie.getFragmentTypes(): Promise\<Void\>
When using Apollo or another tool you may need to get information on the fragment types, genie provides a helper for this
```ts
import { IntrospectionFragmentMatcher, IntrospectionResultData } from 'apollo-cache-inmemory';
const introspectionQueryResultData = <IntrospectionResultData>await genie.getFragmentTypes();
const fragmentMatcher = new IntrospectionFragmentMatcher({
	introspectionQueryResultData
});
```


#### GraphQLGenie.getDataResolver(): DataResolver
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

#### GraphQLGenie.getSchemaBuilder(): GraphQLSchemaBuilder
GraphQLSchemaBuilder has some additional helpers to add types and resolvers to a graphql schema

* **printSchemaWithDirectives()**
	* returns a string of the full schema with directives
* **addTypeDefsToSchema($typeDefs = ''): GraphQLSchema**
	* Completely rebuilds the schema with the new typeDefs. You need to use this if we want any of the custom directives to work on your new typeDefs. Other wise you can use the schema stitching tools from 
* **setResolvers(typeName: string, fieldResolvers: Map<string, GraphQLFieldResolver<any, any>>)**
	* Set resolvers on the schema for the given typename and a map of the fild name to the resolver
* **setIResolvers(iResolvers: IResolvers): GraphQLSchema**
	* Set resolvers of type [IResolvers from graphql-tools](https://www.apollographql.com/docs/graphql-tools/resolvers.html#Resolver-map)
* **isUserType(type: GraphQLType): boolean**
	* returns true if the type isn't generated by GraphQLGenie

> See info about the GraphQLSchemaBuilder class in [GraphQLSchemaBuilder.ts](https://github.com/genie-team/graphql-genie/blob/master/src/GraphQLGenieInterfaces.ts)


Additional documentation is in development, see [examples](https://github.com/genie-team/graphql-genie/tree/master/examples) and [tests](https://github.com/genie-team/graphql-genie/tree/master/src/tests) for implementation examples.

### Authentication

Work is in progress on a plugin to make it extremely easy to add Authentication to a schema created with GraphQL Genie. There are a lot of ways to have some sort of authentication with a GraphQL API and Genie gives you the flexibility to do it any way you want or integrate into services such as Auth0 or Firebase.

Some options to add authentication
 * At the schema level using the [addSchemaLevelResolveFunction](https://www.apollographql.com/docs/graphql-tools/resolvers.html#addSchemaLevelResolveFunction) from graphql-tools
 * At the resolver level use a tool like [graphql-resolvers](https://github.com/lucasconstantino/graphql-resolvers) to combine  a resolver with authentication logic with the resolvers that GraphQL Genie created
 * At the data level create an input hook and add it to the DataResolver (returned by getDataResolver) and throw an error if not authorized 

### How do I do/add [thing] 
You can use the methods on the GraphQLSchemaBuilder (returned by getSchemaBuilder()) to add types and resolvers to the generated schema. Or since it is just a normal schema you can use any tool you want (such as [graphql-tools](https://www.apollographql.com/docs/graphql-tools)) to alter the schema in any way. Including adding resolvers, mocking, stitching, transforming, etc.

If you want guidance feel free to open an issue and mark it as a question.

### TODO

- [ ] API Documentation
- [ ] Authentication Example


#### Thanks/Credit

[Prisma GraphQL / Graphcool](https://github.com/prismagraphql/prisma) for inspiration

[FortuneJS](http://fortune.js.org) for CRUD adapters

Logo Icon made by [Freepik](http://www.freepik.com) from [www.flaticon.com](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)