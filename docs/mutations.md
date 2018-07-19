# Mutations

If you would rather learn by playing with a demo checkout the [client demo](https://genie-team.github.io/graphql-genie-client/).

GraphQL Genie follows [Relay GraphQL Server Specifications](https://facebook.github.io/relay/docs/en/graphql-server-specification.html#mutations). 

> Uses a common pattern for mutations, where they are root fields on the mutation type with a single argument, input, and where the input and output both contain a client mutation identifier used to reconcile requests and responses.

For each type in your model genie can generate create, update, delete and upsert mutations.

For the below schema definition these mutations will be created:
* createCity
* createUser
* updateCity
* updateManyCities
* updateUser
* updateManyUsers
* upsertCity
* upsertUser
* deleteCity
* deleteManyCities
* deleteUser
* deleteManyUsers



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
		generateCreate: true,
		generateUpdate: true,
		generateDelete: true,
		generateUpsert: true
	}
});
```

## Create
