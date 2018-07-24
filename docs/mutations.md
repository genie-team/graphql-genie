# Mutations

If you would rather learn by playing with a demo checkout the [client demo](https://genie-team.github.io/graphql-genie-client/).

GraphQL Genie follows [Relay GraphQL Server Specifications](https://facebook.github.io/relay/docs/en/graphql-server-specification.html#mutations). 

> Uses a common pattern for mutations, where they are root fields on the mutation type with a single argument, input, and where the input and output both contain a client mutation identifier used to reconcile requests and responses.

For each type in your model genie can generate [create](#create), [update](#update), [delete](#delete) and [upsert](#upsert) mutations.



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

Also Genie allows nested mutations, so when creating a city you can create a related user, or connect your relation to an existing user. When updating a city you can create, connect, disconnect, delete, update or upsert a related user.

```typescript 
const typeDefs = `
type City {
	id: ID! @unique
	name: String!
	neighborhoods: [String]
	user: [User]
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

We will take a look at the createCity mutation

```graphql
createCity(input: CreateCityMutationInput!): CityPayload

input CreateCityMutationInput {
	data: CityCreateInput!
	# clientMutationID is optional, but if provided the same clientMutationId will be returned
	clientMutationId: String
}

input CityCreateInput {
	name: String!
	neighborhoods: [String]
	# nested create, create or connect User objects. 
	# Relation will be built automatically to the newly created City
	user: UserCreateManyWithoutAddressInput
	founded: Date
	population: Int
}

input UserCreateManyWithoutAddressInput {
	# create one or more new User objects
	create: [UserCreateWithoutAddressInput!]
	# setup a relation to one or more existing User options, you can connect based on any unique field
	connect: [UserWhereUniqueInput!]
}

input UserWhereUniqueInput {
	id: ID
	displayname: String
	email: String
}
```

### Example
Create a city and a related user

```graphql
mutation {
  createCity(input:{
    data: {
      name: "NY",
      neighborhoods: ["queens", "manhattan"]
      user: {
        create: {
          email: "steve@example.com",
          displayname: "steve"
        }
      }
    },
    clientMutationId: "createNY"
  }) {
    data {
      id
      name
      neighborhoods
      user {
        displayname
      }
    }
    clientMutationId
  }
}
```

will return

```graphql
{
  "data": {
    "createCity": {
      "data": {
        "id": "ID1",
        "name": "NY",
        "neighborhoods": [
          "queens",
          "manhattan"
        ],
        "user": [
          {
            "displayname": "steve"
          }
        ]
      },
      "clientMutationId": "createNY"
    }
  }
}
```

## Update

Updates also have a single argument, input, and a data and clientMutationId like create. They also have a where field. The where field type is the where unique input, same that we saw in the create if we were connecting a User (UserWhereUniqueInput). You can update based on id or any other field that has the @unique directive.

```graphql
updateCity(input: UpdateCityMutationInput!): CityPayload

input UpdateCityMutationInput {
	data: CityUpdateInput!
	# In the case of city this will just be id, but any field with @unique would be allowed
	where: CityWhereUniqueInput!
	clientMutationId: String
}

# The update input is similar to the unique input. 
# Note that updating a scalar field is an input object which has fields for push, pull and set

```

### Example

Say we wanted to update the created city above, we could use the update resolver.

```graphql
mutation {
  updateCity(input:{
    where: {id: "ID1"}
    data: {
      name: "New York",
			"""
			neighborhoods is a list field, so we have the option of push, pull or set when updating
			"""
      neighborhoods: {
        push: ["east side"]
      }      
    },
    clientMutationId: "updateNY"
  }) {
    data {
      id
      name
      neighborhoods
      user {
        displayname
      }
    }
    clientMutationId
  }
}
```

Which will return

```graphql
{
  "data": {
    "updateCity": {
      "data": {
        "id": "ID1",
        "name": "New York",
        "neighborhoods": [
          "queens",
          "manhattan",
          "east side"
        ],
        "user": [
          {
            "displayname": "steve"
          }
        ]
      },
      "clientMutationId": "updateNY"
    }
  }
}

```
