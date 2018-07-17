# Queries

If you would rather learn by playing with a demo checkout the [client demo](https://genie-team.github.io/graphql-genie-client/). Note you can set the Data Mode to Mock in settings to have queries return demo data

If `generateGetAll` is true in the generatorOptions (defaults to true) queries will be created for every type in the model. The name of the query will be the plural version of the type name. 

Every query will have optional arguments `where`, `first`, `last`, `skip`, `before`, `after`. As well as identifying root fields for scalar types. These root fields are the same as doing {where: match:{}}. They are a convenience and allow some more advanced caching with [Relay](https://facebook.github.io/relay/). 

For the following typedefs `users` and `cities` queries will be created.

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

Let's take a close look at what a generated query looks like

```graphql
cities(
	# Filter the results
	where: CityWhereInput
	# Sort the results
	orderBy: CityOrderByInput
	# Slice result from the start of the cursor
	first: Int
	# Slice result from the start of the cursor
	last: Int
	# Skip results from the start of the data
	skip: Int
	# Before this cursor (ID) in the data, see connection queries documentation for more info
	before: String
	# After this cursor (ID) in the data, see connection queries documentation for more info
	after: String
	# id matches at least one of argument
	id: [ID!]
	# name matches at least one of argument
	name: [String!]
	# neighborhoods matches at least one of argument
	neighborhoods: [String!]
	# founded matches at least one of argument
	founded: [Date!]
	# population matches at least one of argument
	population: [Int!]
)
```

The where argument will filter the returned results. 

```graphql
input CityWhereInput {
	# nested where, only find cities where the user matches this
	user: UserWhereInput
	# Filter on whether or not a field exists. 
	# input CityExistsInput {id: Boolean, name: Boolean, neighborhoods: Boolean, user: Boolean}
	exists: CityExistsInput
	# Filter on whether or not a field value matches. Can only check scalar and enum fields
	# name: 'New York' // exact match
	# name:  ['New York', 'LA'] // match any one of these values
	# neighborhoods: 'chinatown' //if neighborhoods contains 'chinatown' as neighborhoods is a list type
	match: CityMatchInput
	# Filter between lower and upper bounds, takes precedence over match
	# name: [ 'a', 'd' ], // Starting with letters A through C.
	# founded: [ null, "2016-01-01" ] // Dates until 2016.
	# population: [ 100000, null ], // From 100000 and above.
	range: CityRangeInput
	# and/or/not will be present if your fortune adapter supports those operations
	and: [CityWhereInput!]
	or: [CityWhereInput!]
	not: CityWhereInput
}
```

The orderBy argument will sort the results. Scalar fields will simply take the ORDER_BY_OPTIONS enum which looks like.

```graphql
enum ORDER_BY_OPTIONS {
  ASCENDING
  DESCENDING
  ASC
  DESC
}
```

You can also sort related types. 

**Note:** Sorting on user here will sort the user type if it is part of the query, not change the sorting of the cities

```graphql
input CityOrderByInput{
	id: ORDER_BY_OPTIONS
	name: ORDER_BY_OPTIONS
	neighborhoods: ORDER_BY_OPTIONS
	user: UserOrderByInput
	founded: ORDER_BY_OPTIONS
	population: ORDER_BY_OPTIONS
}

```

### Examples

**Note: You can see a lot of examples by looking at the [tests](https://github.com/genie-team/graphql-genie/tree/master/src/tests).**
See the [setupTests](https://github.com/genie-team/graphql-genie/blob/master/src/tests/setupTests.ts) file to see the schema and then see the files in the [__tests__](https://github.com/genie-team/graphql-genie/tree/master/src/tests/__tests__) folder for many different examples.

get all the cities

```graphql
query allCities {
	cities {
		id
		name
	}
}
```

get a single city with an id

```graphql
query singleCity {
  cities (id: "ID") {
		id
		name
  }
}
```

get a single city with an id

```graphql
query singleCity {
  cities (id: "ID") {
		id
		name
  }
}
```

use more options

```graphql
query filteredCities {
  cities(
		where: {range: {founded: [null, "1990-01-01"]}}
		orderBy: {founded: ASCENDING}
		skip: 5
		) {
			name
			population
			founded
		}
}

```

Note when requesting objects you can filter as part of the query, this is different than filtering on that type in the arguments of the query in that it won't filter out cities that don't match the input, it will just filter out the results of the user

```graphql
query allCities {
  cities {
		name
		population
		user(where: {exists:{email: true}}) {
			email
		}
  }
}
```

