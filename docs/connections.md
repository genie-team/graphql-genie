# Connections

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

**Note:** You can use the @connection directive to have a field return a Connection rather than just the node. See the [SDL docs](https://github.com/genie-team/graphql-genie/blob/master/docs/sdl.md) for more info.

 The Connection type follows the [Relay Cursor Connections Specification](https://facebook.github.io/relay/graphql/connections.htm). Reading this will give comprehensive documentation on how it works.

 Lets look at a the CityConnection returned by `citiesConnection` query

 ```graphql
"""
A connection to a list of items.
"""
type CityConnection {
  """
  A list of edges.
  """
  edges: [CityEdge]
  """
  Information to aid in pagination.
  """
  pageInfo: PageInfo
  """
  Meta information
  """
  aggregate: CityAggregate
}
type CityEdge {
  node: City!
  cursor: String!
}
"""
Information about pagination in a connection.
"""
type PageInfo {
  """
  When paginating forwards, are there more items?
  """
  hasNextPage: Boolean!
  """
  When paginating backwards, are there more items?
  """
  hasPreviousPage: Boolean!
  """
  When paginating backwards, the cursor to continue.
  """
  startCursor: String
  """
  When paginating forwards, the cursor to continue.
  """
  endCursor: String
}
type CityAggregate {
  """
  The total number that match the where clause
  """
  count: Int!
}
 ```



 ### Examples


**Note: You can see a lot of examples by looking at the [tests](https://github.com/genie-team/graphql-genie/tree/master/src/tests).**
See the [setupTests](https://github.com/genie-team/graphql-genie/blob/master/src/tests/setupTests.ts) file to see the schema and then see the files in the [__tests__](https://github.com/genie-team/graphql-genie/tree/master/src/tests/__tests__) folder for many different examples.

If you wanted to query cities founded before 1990 two at a time you would do a query like this

```graphql
query filteredCities {
  citiesConnection(where: 
    {range: {founded: [null, "1990-01-01"]}}, 
    orderBy: {founded: ASCENDING}, 
    first: 2) {
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      node {
        name
        population
        founded
      }
      cursor
    }
    aggregate {
      count
    }
  }
}
```

Which would return something like

```graphql
{
  "data": {
    "citiesConnection": {
      "pageInfo": {
        "hasNextPage": true,
        "endCursor": "ID2"
      },
      "edges": [
        {
          "node": {
            "name": "NY",
            "population": 500000,
            "founded": "1800-02-23"
          },
          "cursor": "ID1"
        },
        {
          "node": {
            "name": "LA",
            "population": -500000,
            "founded": "1988-02-23"
          },
          "cursor": "ID2"
        }
      ],
      "aggregate": {
        "count": 12
      }
    }
  }
}
```

Then you would check if hasNextPage is true, if so you take the endCursor and pass it as the after arugment in the next call. Like so

```graphql
query filteredCities {
  citiesConnection(where: 
    {range: {founded: [null, "1990-01-01"]}}, 
    orderBy: {founded: ASCENDING}, 
    first: 2,
  	after: "ID2") {
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      node {
        name
        population
        founded
      }
      cursor
    }
    aggregate {
      count
    }
  }
}

```