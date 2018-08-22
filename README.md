<h1 align="center">
    <img width="128px" src="https://raw.githubusercontent.com/genie-team/graphql-genie/master/resources/logo.svg?sanitize=true" alt="GraphQL Genie Logo">
</h1>



# GraphQL Genie <!-- omit in toc --> 

[![npm version](https://img.shields.io/npm/v/graphql-genie.svg)](https://www.npmjs.com/package/graphql-genie)
[![Dependency Status](https://david-dm.org/genie-team/graphql-genie.svg)](https://david-dm.org/genie-team/graphql-genie)
[![devDependency Status](https://david-dm.org/genie-team/graphql-genie/dev-status.svg)](https://david-dm.org/genie-team/graphql-genie/?type=dev)
[![npm](https://img.shields.io/npm/l/graphql-genie.svg)](https://github.com/genie-team/graphql-genie/blob/master/LICENSE)

[![liberapay donate](http://img.shields.io/liberapay/receives/aCoreyJ.svg?logo=liberapay)](https://liberapay.com/aCoreyJ/donate) 
[![patreon](https://img.shields.io/badge/patreon-donate-orange.svg)](https://www.patreon.com/acoreyj/overview) 
[![paypal](https://img.shields.io/badge/paypal-donate-blue.svg)](https://www.paypal.com/pools/c/872dOkFVLP) 


- [Overview](#overview)
- [Installation](#installation)
- [Demo](#demo)
- [Getting started](#getting-started)
- [Documentation and Features](#documentation-and-features)
	- [Schema Defining, Altering and Migrations](#schema-defining-altering-and-migrations)
	- [Data Store Options](#data-store-options)
	- [GraphQL Genie Schema API (queries and mutations)](#graphql-genie-schema-api-queries-and-mutations)
	- [GraphQLGenie API](#graphqlgenie-api)
	- [Subscriptions](#subscriptions)
	- [Authentication](#authentication)
- [Examples](#examples)
	- [Client](#client)
	- [Server](#server)
- [Features/Advantages/Differences](#featuresadvantagesdifferences)
- [Roadmap](#roadmap)
- [Changelog](#changelog)
- [Contribute or Donate](#contribute-or-donate)
- [Backers](#backers)

## Overview

Simply pass in your [GraphQL type defintions](https://github.com/genie-team/graphql-genie/blob/master/docs/sdl.md) and get a fully featured GraphQL API with referential integrity, inverse updates, subscriptions and role based access control that can be used client side or server side. 

- **Full GraphQL Support** You can use all the features of the type schema, including interfaces and unions. 
- **Feature Rich API** including nested operations, filtered queries, pagination. Transactional if your adapter supports it.
- **Easy to extend with plugins** Ones already exist to [add subscriptions](https://github.com/genie-team/graphql-genie/tree/master/plugins/subscriptions) and [setup role based access control](https://github.com/genie-team/graphql-genie/tree/master/plugins/authentication).    
- **Works with other GraphQL libraries** like [Relay](https://facebook.github.io/relay/)(react) and [Apollo Client](https://github.com/apollographql/apollo-client)(vanilla js or any framework)
- **Portable data** with a variety of [data stores](#data-store-options) including client and server side support and [Export](https://github.com/genie-team/graphql-genie/blob/master/docs/GraphQLGenieAPI.md#getrawdata)/[Import/Merge](https://github.com/genie-team/graphql-genie/blob/master/docs/GraphQLGenieAPI.md#importrawdata) query/mutation fields and functions. 
- **FortuneJS Storage** allows many storage options and the ability to easily create your own. See [data store options](#data-store-options)
 

In short GraphQL Genie handles creating the root Query, Mutation and Subscription types and resolvers for a variety of [data stores](#data-store). If that doesn't mean anything to you it may be good to read up on some [graphql basics](https://www.okgrow.com/posts/graphql-basics) or learn by experimenting with the [demo](https://genie-team.github.io/graphql-genie-client/)



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
   2. call genie.getSchema() to get the GraphQLSchema

```typescript
import { FortuneOptions, GraphQLGenie } from 'graphql-genie';
import mongodbAdapter from 'fortune-mongodb';

//adapter: configuration array for the data store. The default type is the memory adapter. See below for other adapter options
const fortuneOptions: FortuneOptions = {
  // see the documentation for your specific adapter
  adapter: [    
    mongodbAdapter,
    {
      // options object, URL is mandatory.
      url: config.mongodbURL
    }
  ]
};
// Instantiate Genie with your type defintions as a string
const typeDefs = `
type City {
  id: ID! @unique
  name: String!
  neighborhoods: [String] @unique
  residents: [User] @relation(name: "city")
  founded: Date
  population: Int
}
type User {
  id: ID! @unique
  displayname: String @unique
  email: String! @unique
  location: City @relation(name: "city")
}`;
const genie = new GraphQLGenie({ 
    typeDefs: typeDefs, 
    fortuneOptions: fortuneOptions
});

// get the schema and use it with any other tools you want
const schema: GraphQLSchema = genie.getSchema();
```

## Documentation and Features

### Schema Defining, Altering and Migrations

[Documentation in docs/sdl.md](https://github.com/genie-team/graphql-genie/blob/master/docs/sdl.md)

### Data Store Options

GraphQLGenie uses [FortuneJS](http://fortune.js.org) for accessing the data store. This means any [fortune adapter](http://fortune.js.org/plugins/) will work, plugins currently exist for memory ([example](https://github.com/genie-team/graphql-genie/tree/master/examples/memory)), [localforage](https://github.com/genie-team/fortune-localforage), [IndexedDB](https://github.com/fortunejs/fortune-indexeddb) ([example](https://github.com/genie-team/graphql-genie/tree/master/examples/indexeddb)), [MongoDB](https://github.com/fortunejs/fortune-mongodb) ([example](https://github.com/genie-team/graphql-genie/tree/master/examples/mongodb)), [PostgreSQL](https://github.com/fortunejs/fortune-postgres) ([example](https://github.com/genie-team/graphql-genie/tree/master/examples/graphql-yoga-postgresql)), [Redis](https://github.com/thibremy/fortune-redis) ([examples](#server)), [Google Cloud Datastore](https://github.com/patrinhani-ciandt/fortune-datastore), [NeDB](https://github.com/fortunejs/fortune-nedb) and [File System](https://github.com/fortunejs/fortune-fs). Or you could [write your own adapter](http://fortune.js.org/api/#adapter).

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

Checkout the [authentication plugin](https://github.com/genie-team/graphql-genie/tree/master/plugins/authentication) to easily implement role based access control down to individual fields. 

See the [apollo server 2 redis jwt example](https://github.com/genie-team/graphql-genie/tree/master/examples/apollo-server2-redis-jwt-auth) for JWT authentication with users stored in the database. Uses Apollo Server 2.

See the [yoga redis example](https://github.com/genie-team/graphql-genie/tree/master/examples/graphql-yoga-redis-authentication) for session authentication with users stored in the database.

See the [yoga redis firebase example](https://github.com/genie-team/graphql-genie/tree/master/examples/graphql-yoga-redis-firebase-auth) for using firebase authentication to login and control access from an external JWT provider.

Of course Genie creates a normal schema so you can add authentication in any other way you want. (the [authentication plugin](https://github.com/genie-team/graphql-genie/tree/master/plugins/authentication) uses a combination of all of these)

* At the schema level using the context function or [addSchemaLevelResolveFunction](https://www.apollographql.com/docs/graphql-tools/resolvers.html#addSchemaLevelResolveFunction) from graphql-tools
* At the resolver level by wrapping the resolver functions that GraphQL Genie created in the schema, or use a tool like [graphql-resolvers](https://github.com/lucasconstantino/graphql-resolvers) to combine resolver, with authentication logic.
* At the data level create an [input hook](https://github.com/genie-team/graphql-genie/blob/master/docs/GraphQLGenieAPI.md#getdataresolver) and add it to the DataResolver (returned by getDataResolver, see the [api documentation](https://github.com/genie-team/graphql-genie/blob/master/docs/GraphQLGenieAPI.md)) and throw an error if not authorized.

### How do I do/add [thing] <!-- omit in toc --> 

You can use the methods on the GraphQLSchemaBuilder (returned by getSchemaBuilder()) to add types and resolvers to the generated schema. Or since it is just a normal schema you can use any tool you want (such as [graphql-tools](https://www.apollographql.com/docs/graphql-tools)) to alter the schema in any way. Including adding resolvers, mocking, stitching, transforming, etc.

If you want guidance feel free to [ask](https://stackoverflow.com/questions/ask) on [stack overflow](https://stackoverflow.com/questions/tagged/graphql-genie) (tag with graphql-genie)

## Examples

### Client

#### [Memory](https://github.com/genie-team/graphql-genie/tree/master/examples/memory) <!-- omit in toc --> 

Sets up an API that stores data in browser memory

#### [IndexedDB](https://github.com/genie-team/graphql-genie/tree/master/examples/indexeddb) <!-- omit in toc --> 

Sets up an API that stores data in browser Indexed DB

### Server

#### [Apollo Server 2 Redis with JWT Authentication](https://github.com/genie-team/graphql-genie/tree/master/examples/apollo-server2-redis-jwt-auth) <!-- omit in toc --> 

Sets up a server using [Apollo Server 2](https://github.com/apollographql/apollo-server) and an api that stores to a mock Redis with json web token based signup and login. Uses the [authentication plugin](https://github.com/genie-team/graphql-genie/tree/master/plugins/authentication) for role based access control.

#### [GrapqhQL Yoga Redis with Session Authentication](https://github.com/genie-team/graphql-genie/tree/master/examples/graphql-yoga-redis-authentication) <!-- omit in toc --> 

Sets up a server using [GrapqhQL Yoga](https://github.com/prismagraphql/graphql-yoga) and an api that stores to a mock Redis with session based signup and login. Uses the [authentication plugin](https://github.com/genie-team/graphql-genie/tree/master/plugins/authentication) for role based access control.

#### [GrapqhQL Yoga Redis with Firebase Authentication](https://github.com/genie-team/graphql-genie/tree/master/examples/graphql-yoga-redis-firebase-auth) <!-- omit in toc --> 

Sets up a server using [GrapqhQL Yoga](https://github.com/prismagraphql/graphql-yoga) and an api that stores to a mock Redis. Serves static html for [firebase](https://firebase.google.com/docs/auth/) signup and login. Uses the [authentication plugin](https://github.com/genie-team/graphql-genie/tree/master/plugins/authentication) for role based access control.

#### [GraphQL Yoga PostgreSQL](https://github.com/genie-team/graphql-genie/tree/master/examples/graphql-yoga-postgresql) <!-- omit in toc --> 

Sets up a server using [GrapqhQL Yoga](https://github.com/prismagraphql/graphql-yoga) and an API that stores to PostgreSQL.

### Other <!-- omit in toc --> 

#### [MongoDB](https://github.com/genie-team/graphql-genie/tree/master/examples/mongodb) <!-- omit in toc --> 

Creates a simple node script that uses the GraphQL Genie api to store in a MongoDB database

## Features/Advantages/Differences

GraphQL Genie is inspired by [Prisma GraphQL](https://github.com/prismagraphql/prisma) and the resulting API has a lot of similarities but they have different goals. Because GraphQL Genie gives you a fully functioning graphql api but is not opinionated about anything else you have the flexibility to use that schema wherever you want and integrate it with any existing services you use. 

* Bi-directional relationships in any database with a GraphQL API
* Portable storage options, great for Progressive Web Apps. Use anywhere for any purpose.
* [Export](https://github.com/genie-team/graphql-genie/blob/master/docs/GraphQLGenieAPI.md#getrawdata)/[Import/Merge](https://github.com/genie-team/graphql-genie/blob/master/docs/GraphQLGenieAPI.md#importrawdata) data between data sources. Used in some examples to seed data or see [examples in test case](https://github.com/genie-team/graphql-genie/blame/master/src/tests/__tests__/genie.ts#L912)
* Share GraphQL data model on server and client. import/export mutation/query fields will also be created.
* You can use [The Apollo Platform](https://www.apollographql.com/), [Relay](https://facebook.github.io/relay/), [GraphQL Bindings](https://github.com/graphql-binding/graphql-binding) or any of the many other tools in the growing GraphQL ecosystem. 
* You can use your existing [authentication](#authentication) methods or one provided by an outside service.
* The api stays the same regardless of data source, so you are never locked into one database or even server/client side 
* You can make your api logic completely serverless
* You can use all the features of the type schema, including interfaces and unions.
* [Input and Output hooks](https://github.com/genie-team/graphql-genie/blob/master/docs/GraphQLGenieAPI.md#getdataresolver) against the actual data resolver add more possibilities for advanced functionality
* [FortuneJS](http://fortune.js.org) allows easy creation of new adapters

## Roadmap
* Progressive Web App example
* More advanced migration and build process features

## Changelog
* See [releases](https://github.com/genie-team/graphql-genie/releases)

## Contribute or Donate
* Code Contributions
	* Fork
	* Make Changes
	* Run the following and make sure no failures or errors
		* npm run test
		* npm run lint
		* npm run build
		* npm run browser
		* npm run module
	* Open pull request
* Donate 
	* Genie and other genie-team products are outcomes of a hobby and receive no other funding, any and all support would be greatly appreciated if you find Genie products useful. Your support will encourage faster development of bug fixes, new features and new products.
	* [![donate](http://img.shields.io/liberapay/receives/aCoreyJ.svg?logo=liberapay)](https://liberapay.com/aCoreyJ/donate) (preferred)
	* [![patreon](https://img.shields.io/badge/patreon-donate-orange.svg)](https://www.patreon.com/acoreyj/overview) 
	* [![paypal](https://img.shields.io/badge/paypal-donate-blue.svg)](https://www.paypal.com/pools/c/872dOkFVLP) 


## Backers

[Your Name and link Here]

If you contribute and want a thanks callout on genie project READMEs let me know via [twitter message](https://twitter.com/aCoreyJ) (at least 1.00/month). Thanks so much!

## Thanks/Credit <!-- omit in toc --> 

[Prisma GraphQL / Graphcool](https://github.com/prismagraphql/prisma) for inspiration

[FortuneJS](http://fortune.js.org) for CRUD adapters

Logo Icon made by [Freepik](http://www.freepik.com) from [www.flaticon.com](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)
