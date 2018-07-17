# Queries

If you would rather learn by playing with a demo checkout the [client demo](https://genie-team.github.io/graphql-genie-client/). Note you can set the Data Mode to Mock in settings to have queries return demo data

If `generateConnections` is true in the generatorOptions (defaults to true) connection queries will be created for every type in the model. The name of the query will be the plural version of the type name followed by Connection. 

Every query will have optional arguments `where`, `first`, `last`, `skip`, `before`, `after`. As well as identifying root fields for scalar types. These root fields are the same as doing {where: match:{}}. They are a convenience and allow some more advanced caching with [Relay](https://facebook.github.io/relay/).

For the following typedefs `citiesConnection` and `usersConnection` queries will be created.

```typescript 
const typeDefs = `
type City {
	id: ID! @unique
	name: String!
	neighborhoods: [String]
	user: User
	founded: Date
	population: Int
}
type User {
	id: ID! @unique
	displayname: String @unique
	email: String! @unique
	address: City
}
`
const genie = new GraphQLGenie({ 
	typeDefs, 
	generatorOptions: {
		generateGetAll: true,
	}
});
```

 See the [Type Queries](https://github.com/genie-team/graphql-genie/blob/master/docs/queries.md) documentation for more on the arguments.

 The main difference with connection queries is that they return a Connection rather than the type. Connections allow easier and cacheable pagination.

 The Connection type follows the [Relay Cursor Connections Specification](https://facebook.github.io/relay/graphql/connections.htm).