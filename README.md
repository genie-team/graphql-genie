<h1 align="center">
    <img width="128px" src="https://raw.githubusercontent.com/genie-team/graphql-genie/master/resources/logo.svg?sanitize=true" alt="GraphQL Genie Logo">
</h1>

- [GraphQL Genie](#graphql-genie)
	- [Installation](#installation)
	- [Demo](#demo)
	- [Getting started](#getting-started)
	- [Documentation and Features](#documentation-and-features)
		- [Data Store Options](#data-store-options)
		- [GraphQL Genie Schema API (queries and mutations)](#graphql-genie-schema-api-queries-and-mutations)
		- [GraphQLGenie API](#graphqlgenie-api)
		- [Subscriptions](#subscriptions)
		- [Authentication](#authentication)
		- [How do I do/add [thing]](#how-do-i-doadd-thing)
	- [Examples](#examples)
		- [Client](#client)
			- [Memory](#memory)
			- [IndexedDB](#indexeddb)
		- [Server](#server)
			- [Apollo Server 2 Redis with JWT Authentication](#apollo-server-2-redis-with-jwt-authentication)
			- [GrapqhQL Yoga Redis with Session Authentication](#grapqhql-yoga-redis-with-session-authentication)
			- [GrapqhQL Yoga Redis with Firebase Authentication](#grapqhql-yoga-redis-with-firebase-authentication)
			- [GraphQL Yoga PostgreSQL](#graphql-yoga-postgresql)
		- [Other](#other)
			- [MongoDB](#mongodb)
	- [Features/Advantages/Differences](#featuresadvantagesdifferences)
	- [Thanks/Credit](#thankscredit)

# GraphQL Genie

[![npm version](https://img.shields.io/npm/v/graphql-genie.svg)](https://www.npmjs.com/package/graphql-genie)
[![Dependency Status](https://david-dm.org/genie-team/graphql-genie.svg)](https://david-dm.org/genie-team/graphql-genie)
[![devDependency Status](https://david-dm.org/genie-team/graphql-genie/dev-status.svg)](https://david-dm.org/genie-team/graphql-genie/?type=dev)
[![npm](https://img.shields.io/npm/l/graphql-genie.svg)](https://github.com/genie-team/graphql-genie/blob/master/LICENSE)

Write a [GraphQL Type Schema](https://graphql.org/learn/schema/) and [GraphQL Genie](https://github.com/genie-team/graphql-genie) automatically generates a fully featured GraphQL API with referential integrity and inverse updates that can be used client side or server side. You can use all the features of the type schema, including interfaces and unions. GraphQL Genie is easy to extend with plugins, ones already exist to [add subscriptions](https://github.com/genie-team/graphql-genie/tree/master/plugins/subscriptions) and [setup role based authentication](https://github.com/genie-team/graphql-genie/tree/master/plugins/authentication).

The schema uses best practices and is compliant with the [Relay GraphQL Server Specification](https://facebook.github.io/relay/docs/en/graphql-server-specification.html#mutations).     

In short GraphQL Genie handles creating the root Query, Mutation and Subscription types and resolvers for a variety of [data stores](#data-store). If that doesn't mean anything to you it may be good to read up on some [graphql basics](https://www.okgrow.com/posts/graphql-basics) or learn by experimenting with the [demo]((https://genie-team.github.io/graphql-genie-client/))

## Installation

`npm install graphql-genie fortune graphql graphql-tools lodash`

or 

`yarn add graphql-genie fortune graphql graphql-tools lodash`

## Demo

[See the fully featured demo](https://genie-team.github.io/graphql-genie-client/). Create a schema (or use the default provided) and a fully featured api is created. Click the search icon to use GraphiQL to view docs and create or mock data. See [graphql genie client](https://github.com/genie-team/graphql-genie-client) on github for more info on the demo.

Or for a server demo see the [server examples](#server).


## Getting started

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
## Documentation and Features

### Data Store Options

GraphQLGenie uses [FortuneJS](http://fortune.js.org) for accessing the data store. This means any [fortune adapter](http://fortune.js.org/plugins/) will work, plugins currently exist for memory ([example](https://github.com/genie-team/graphql-genie/tree/master/examples/memory)), [IndexedDB](https://github.com/fortunejs/fortune-indexeddb) ([example](https://github.com/genie-team/graphql-genie/tree/master/examples/indexeddb)), [MongoDB](https://github.com/fortunejs/fortune-mongodb) ([example](https://github.com/genie-team/graphql-genie/tree/master/examples/mongodb)), [Postgres](https://github.com/fortunejs/fortune-postgres) ([example](https://github.com/genie-team/graphql-genie/tree/master/examples/graphql-yoga-postgresql)), [Redis](https://github.com/thibremy/fortune-redis), [Google Cloud Datastore](https://github.com/patrinhani-ciandt/fortune-datastore), [NeDB](https://github.com/fortunejs/fortune-nedb) and [File System](https://github.com/fortunejs/fortune-fs). Or you could write your own.

### GraphQL Genie Schema API (queries and mutations)
 * [Type Queries](https://github.com/genie-team/graphql-genie/blob/master/docs/queries.md)
 * [Connection Queries](https://github.com/genie-team/graphql-genie/blob/master/docs/connections.md)
 * [Mutations](https://github.com/genie-team/graphql-genie/blob/master/docs/mutations.md)
 * Also see the [subscriptions plugin](https://github.com/genie-team/graphql-genie/tree/master/plugins/subscriptions)
	

### GraphQLGenie API

The [api documentation](https://github.com/genie-team/graphql-genie/blob/master/docs/GraphQLGenieAPI.md) can be found in the docs folder 

### Subscriptions

[GraphQL Genie](https://github.com/genie-team/graphql-genie) also supports subscriptions with the [subscriptions plugin](https://github.com/genie-team/graphql-genie/tree/master/plugins/subscriptions). 


### Authentication

Checkout the [authentication plugin](https://github.com/genie-team/graphql-genie/tree/master/plugins/authentication) to easily implement role based authentication down to individual fields. 

See the [apollo server 2 redis jwt example](https://github.com/genie-team/graphql-genie/tree/master/examples/apollo-server2-redis-jwt-auth) for JWT authentication with users stored in the database. Uses Apollo Server 2.

See the [yoga redis example](https://github.com/genie-team/graphql-genie/tree/master/examples/graphql-yoga-redis-authentication) for session authentication with users stored in the database.

See the [yoga redis firebase example](https://github.com/genie-team/graphql-genie/tree/master/examples/graphql-yoga-redis-firebase-auth) for using firebase authentication to login and control access from an external JWT provider.

Of course Genie creates a normal schema so you can add authentication in any other way you want. (the [authentication plugin](https://github.com/genie-team/graphql-genie/tree/master/plugins/authentication) uses a combination of all of these)

* At the schema level using the context function or [addSchemaLevelResolveFunction](https://www.apollographql.com/docs/graphql-tools/resolvers.html#addSchemaLevelResolveFunction) from graphql-tools
* At the resolver level by wrapping the resolver functions that GraphQL Genie created in the schema, or use a tool like [graphql-resolvers](https://github.com/lucasconstantino/graphql-resolvers) to combine resolver, with authentication logic.
* At the data level create an input hook and add it to the DataResolver (returned by getDataResolver, see the [api documentation](https://github.com/genie-team/graphql-genie/blob/master/docs/GraphQLGenieAPI.md)) and throw an error if not authorized.

### How do I do/add [thing]

You can use the methods on the GraphQLSchemaBuilder (returned by getSchemaBuilder()) to add types and resolvers to the generated schema. Or since it is just a normal schema you can use any tool you want (such as [graphql-tools](https://www.apollographql.com/docs/graphql-tools)) to alter the schema in any way. Including adding resolvers, mocking, stitching, transforming, etc.

If you want guidance feel free to open an issue and label it as a question.

## Examples

### Client

#### [Memory](https://github.com/genie-team/graphql-genie/tree/master/examples/memory)

Sets up an API that stores data in browser memory

#### [IndexedDB](https://github.com/genie-team/graphql-genie/tree/master/examples/indexeddb)

Sets up an API that stores data in browser Indexed DB

### Server

#### [Apollo Server 2 Redis with JWT Authentication](https://github.com/genie-team/graphql-genie/tree/master/examples/apollo-server2-redis-jwt-auth)

Sets up a server using [Apollo Server 2](https://github.com/apollographql/apollo-server) and an api that stores to a mock Redis with json web token based signup and login. Uses the [authentication plugin](https://github.com/genie-team/graphql-genie/tree/master/plugins/authentication) for role based access control.

#### [GrapqhQL Yoga Redis with Session Authentication](https://github.com/genie-team/graphql-genie/tree/master/examples/graphql-yoga-redis-authentication)

Sets up a server using [GrapqhQL Yoga](https://github.com/prismagraphql/graphql-yoga) and an api that stores to a mock Redis with session based signup and login. Uses the [authentication plugin](https://github.com/genie-team/graphql-genie/tree/master/plugins/authentication) for role based access control.

#### [GrapqhQL Yoga Redis with Firebase Authentication](https://github.com/genie-team/graphql-genie/tree/master/examples/graphql-yoga-redis-firebase-auth)

Sets up a server using [GrapqhQL Yoga](https://github.com/prismagraphql/graphql-yoga) and an api that stores to a mock Redis. Serves static html for [firebase](https://firebase.google.com/docs/auth/) signup and login. Uses the [authentication plugin](https://github.com/genie-team/graphql-genie/tree/master/plugins/authentication) for role based access control.

#### [GraphQL Yoga PostgreSQL](https://github.com/genie-team/graphql-genie/tree/master/examples/graphql-yoga-postgresql)

Sets up a server using [GrapqhQL Yoga](https://github.com/prismagraphql/graphql-yoga) and an API that stores to PostgreSQL.

### Other

#### [MongoDB](https://github.com/genie-team/graphql-genie/tree/master/examples/mongodb)

Creates a simple node script that uses the GraphQL Genie api to store in a MongoDB database

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

## Thanks/Credit

[Prisma GraphQL / Graphcool](https://github.com/prismagraphql/prisma) for inspiration

[FortuneJS](http://fortune.js.org) for CRUD adapters

Logo Icon made by [Freepik](http://www.freepik.com) from [www.flaticon.com](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)
