<h1 align="center">
    <img width="128px" src="https://raw.githubusercontent.com/genie-team/graphql-genie/master/resources/logo.svg?sanitize=true" alt="GraphQL Genie Logo">
</h1>

# GraphQL Genie

[![npm version](https://img.shields.io/npm/v/graphql-genie.svg)](https://www.npmjs.com/package/graphql-genie)
[![Dependency Status](https://david-dm.org/genie-team/graphql-genie.svg)](https://david-dm.org/genie-team/graphql-genie)
[![devDependency Status](https://david-dm.org/genie-team/graphql-genie/dev-status.svg)](https://david-dm.org/genie-team/graphql-genie/?type=dev)
[![npm](https://img.shields.io/npm/l/graphql-genie.svg)](https://github.com/genie-team/graphql-genie/blob/master/LICENSE)

Write a [GraphQL Type Schema](https://graphql.org/learn/schema/) and [GraphQL Genie](https://github.com/genie-team/graphql-genie) automatically generates a fully featured GraphQL API with referential integrity and inverse updates that can be used client side or server side. You can use all the features of the type schema, including interfaces and unions. Add subscriptions with the [plugin](https://github.com/genie-team/graphql-genie/tree/master/plugins/subscriptions). The schema uses best practices and is compliant with the [Relay GraphQL Server Specification](https://facebook.github.io/relay/docs/en/graphql-server-specification.html#mutations).     

## Demo

[See the fully featured demo](https://genie-team.github.io/graphql-genie-client/). Create a schema (or use the default provided) and a fully featured api is created. Click the search to use GraphiQL to view docs and create or mock data. See [graphql genie client](https://github.com/genie-team/graphql-genie-client) on github for more info on the demo.

### Installation

`npm install graphql-genie fortune graphql graphql-tools lodash` or `yarn add graphql-genie fortune graphql graphql-tools lodash`

### Getting started

1. [Create your type definitions.](https://github.com/genie-team/graphql-genie/blob/master/docs/sdl.md) These are GraphQL Type definitions, GraphQL Genie does have some additional directives which may be useful (unique, relations, timestamps, default values). [Documentation in docs/sdl.md](https://github.com/genie-team/graphql-genie/blob/master/docs/sdl.md)
2. Setup fortune options with your adapter and other settings. See example below or [fortune docs](http://fortune.js.org/api/#fortune-constructor) and documentation for your adapter
3. Create the schema using genie.
   1. Create a new GraphQLGenie object
   2. call genie.init() (returns a promise)
   3. call genie.getSchema() to get the GraphQLSchema

```typescript
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
// Instantiate Genie with your type defintions as a string
const typeDefs = `[TYPEDEFS]`
const genie = new GraphQLGenie({ 
    typeDefs: typeDefs, 
    fortuneOptions: fortuneOptions
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

### GraphQLGenie API

The [api documentation](https://github.com/genie-team/graphql-genie/blob/master/docs/GraphQLGenieAPI.md) can be found in the docs folder 

### Authentication

Work is in progress on a plugin to make it extremely easy to add Authentication to a schema created with GraphQL Genie. There are a lot of ways to have some sort of authentication with a GraphQL API and Genie gives you the flexibility to do it any way you want or integrate into services such as Auth0 or Firebase.

Some options to add authentication

* At the schema level using the [addSchemaLevelResolveFunction](https://www.apollographql.com/docs/graphql-tools/resolvers.html#addSchemaLevelResolveFunction) from graphql-tools
* At the resolver level use a tool like [graphql-resolvers](https://github.com/lucasconstantino/graphql-resolvers) to combine  a resolver with authentication logic with the resolvers that GraphQL Genie created
* At the data level create an input hook and add it to the DataResolver (returned by getDataResolver) and throw an error if not authorized 

### How do I do/add [thing]

You can use the methods on the GraphQLSchemaBuilder (returned by getSchemaBuilder()) to add types and re``solvers to the generated schema. Or since it is just a normal schema you can use any tool you want (such as [graphql-tools](https://www.apollographql.com/docs/graphql-tools)) to alter the schema in any way. Including adding resolvers, mocking, stitching, transforming, etc.

If you want guidance feel free to open an issue and label it as a question.

**Additional documentation is in development, see [examples](https://github.com/genie-team/graphql-genie/tree/master/examples) and [tests](https://github.com/genie-team/graphql-genie/tree/master/src/tests) for implementation examples.**

## Features/Advantages/Differences

GraphQL Genie is inspired by [Prisma GraphQL](https://github.com/prismagraphql/prisma) and the resulting API has a lot of similarities but they have different goals. Because GraphQL Genie gives you a fully functioning graphql api but is not opinionated about anything else you have the flexibility to use that schema wherever you want and integrate it with any existing services you use. 

* Bi-directional relationships in any database with a GraphQL API
* Portable storage options, use anywhere for any purpose which is essential for some applications.
* Export/Import/Merge data between data sources
* Share GraphQL data model on server and client
* You can use [The Apollo Platform](https://www.apollographql.com/), [Relay](https://facebook.github.io/relay/), [GraphQL Bindings](https://github.com/graphql-binding/graphql-binding) or any of the many other tools in the growing GraphQL ecosystem. 
* You can use your existing [authentication](#authentication) methods or one provided by an outside service.
* The api stays the same regardless of data source, so you are never locked into one database or even server/client side 
* You can make your api logic completely serverless

### TODO

- [ ] API Documentation
- [ ] Authentication Example
- [ ] GraphQL Yoga Example

#### Thanks/Credit

[Prisma GraphQL / Graphcool](https://github.com/prismagraphql/prisma) for inspiration

[FortuneJS](http://fortune.js.org) for CRUD adapters

Logo Icon made by [Freepik](http://www.freepik.com) from [www.flaticon.com](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)
