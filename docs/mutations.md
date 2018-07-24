- [Mutations](#mutations)
  - [Create](#create)
    - [Example](#example)
  - [Update](#update)
    - [Examples](#examples)
      - [Update the city name and push onto neighborhoods](#update-the-city-name-and-push-onto-neighborhoods)
      - [Update the user connected to the city](#update-the-user-connected-to-the-city)
  - [Upsert](#upsert)
    - [Examples](#examples-1)
      - [Upsert a user resulting in a create](#upsert-a-user-resulting-in-a-create)
      - [Upsert a user resulting in an update](#upsert-a-user-resulting-in-an-update)
  - [Delete](#delete)
    - [Examples](#examples-2)
      - [Delete a user](#delete-a-user)
  - [UpdateMany and DeleteMany](#updatemany-and-deletemany)
    - [Examples](#examples-3)
      - [UpdateManyUsers](#updatemanyusers)

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

Updates also have a single argument, input. input has data and clientMutationId arguments like create. They also have a where field. The where field type is the where unique input, same that we saw in the create if we were connecting a User (UserWhereUniqueInput). You can update based on id or any other field that has the @unique directive.

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

A major difference between the UpdateInput and the CreateInput is on related types. While creating a City you can only create/connect a user. But while updating a City you can create, connect, disconnect, delete, update and upsert.

```graphql
type CityUpdateInput {
  name: String
  # neighborhoods is a list field, so we have the option of push, pull or set when updating
  neighborhoods: StringScalarListInput
  user: UserUpdateManyWithoutAddressInput
  founded: Date
  population: Int
}
type UserUpdateManyWithoutAddressInput {
  # create a new user that is related to this city
  create: [UserCreateWithoutAddressInput!]
  # relate an existing user to this city
  connect: [UserWhereUniqueInput!]
  # un-relate a user matching the where unique input
  disconnect: [UserWhereUniqueInput!]
  # delete a user matching the where unique input
  delete: [UserWhereUniqueInput!]
  # update a user matching the where unique input with the supplied data
  update: [UserUpdateWithWhereUniqueWithoutAddressInput!]
  # upsert a user matching the where unique input with the supplied data
  upsert: [UserUpsertWithWhereUniqueWithoutAddressInput!]
}
```

### Examples

#### Update the city name and push onto neighborhoods

Say we wanted to update the created city above, we could use the update resolver.

```graphql
mutation {
  updateCity(input:{
    where: {id: "ID1"}
      data: {
      name: "New York",
      # neighborhoods is a list field, so we have the option of push, pull or set when updating
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

#### Update the user connected to the city

```graphql
mutation {
  updateCity(input:{
    where: {id: "ID1"}
    data: {
      name: "New York",
      user: {
        update: {
          where: {
            displayname: "steve"
          }
          data: {
            email: "steven@example.com"
          }
        }
      }
    },
  }) {
    data {
      name
      user {
        displayname
        email
      }
    }
  }
}
```

will return

```graphql
{
  "data": {
    "updateCity": {
      "data": {
        "name": "New York",
        "user": [
          {
            "displayname": "steve",
            "email": "steven@example.com"
          }
        ]
      }
    }
  }
}
```


## Upsert

Upserts also have a single argument, input. input has where and clientMutationId arguments like update. But instead of a data field it has a create and an update field. If the where argument finds something the update data will be used and the record will be updated, otherwise a new record will be created with the create data

```graphql
type UpsertUserMutationInput {
  create: UserCreateInput!
  update: UserUpdateInput!
  where: UserWhereUniqueInput!
  clientMutationId: String
}
```

### Examples

#### Upsert a user resulting in a create

```graphql
mutation {
  upsertUser(input:{
    where: {email: "zeus@example.com"},
    create: {
      email: "zeus@example.com"     
    },
    update: {
      displayname: "zeus"
    }
  }) {
    data {      
      displayname
      email
    }
  }
}
```

will return 

```graphql
{
  "data": {
    "upsertUser": {
      "data": {
        "displayname": null,
        "email": "zeus@example.com"
      }
    }
  }
}
```

#### Upsert a user resulting in an update

```graphql
mutation {
  upsertUser(input:{
    where: {email: "zeus@example.com"},
    create: {
      email: "zeus@example.com"     
    },
    update: {
      displayname: "zeus"
    }
  }) {
    data {      
      displayname
      email
    }
  }
}
```

will return 

```graphql
{
  "data": {
    "upsertUser": {
      "data": {
        "displayname": "zeus",
        "email": "zeus@example.com"
      }
    }
  }
}
```

## Delete

Deletes also have a single argument, input. input has where and clientMutationId arguments. The data returned will be of the record that used to exist

### Examples

#### Delete a user
```graphql
mutation {
  deleteUser(input:{
    where: {email: "zeus@example.com"},
    clientMutationId: "deleteUser"
  }) {
    data {      
      displayname
      email
    }
    clientMutationId
  }
}
```

will return

```graphql
{
  "data": {
    "deleteUser": {
      "data": {
        "displayname": "zeus",
        "email": "zeus@example.com"
      },
      "clientMutationId": "deleteUser"
    }
  }
}
```

## UpdateMany and DeleteMany

UpdateMany and DeleteMany have a single argument input. input has the same arguments (where, clientMutationId and data if an update). The difference is the where argument contains all the arguments used in [queries](https://github.com/genie-team/graphql-genie/blob/master/docs/queries.md), not just the unique fields. Many mutations return a BatchPayload which has the number of fields updated

```graphql
input UpdateManyCitiesMutationInput {
  data: CityUpdateInput!
  where: CityWhereInput!
  clientMutationId: String
}: BatchPayload

# see type queries documentation for more info on these arguments
input CityWhereInput {
  user: UserWhereInput
  exists: CityExistsInput
  match: CityMatchInput
  range: CityRangeInput
  and: [CityWhereInput!]
  or: [CityWhereInput!]
  not: CityWhereInput
}

type BatchPayload {
  # The number of nodes that have been affected by the Batch operation.
  count: Int!  
  clientMutationId: String
}
```

### Examples

#### UpdateManyUsers

```graphql
mutation {
  updateManyUsers(input: {
    where: {
      exists: {
        displayname: true
      }
    },
    data: {
      displayname: "joe"
    }
  }) {
    count
  }
}
```

will return

```graphql
{
  "data": {
    "updateManyUsers": {
      "count": 1
    }
  }
}
```