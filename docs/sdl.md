
**GraphQLGenie works off regular [GraphQL type defintions](https://graphql.org/learn/schema/) with some additional features**

#### Custom directives you can use.
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
*  **@model**
	*  By default any object type will be part of the CRUD model, using the @model directive will limit to just types that use this directive


#### Scalar Types
In addition to the [default scalar types](https://graphql.org/learn/schema/#scalar-types) (Int, Float, String, Boolean, ID) GraphQL Genie comes built in with scalar fields Date, Time, DateTime ([learn more](https://www.npmjs.com/package/graphql-iso-date)) and JSON ([learn more](https://github.com/taion/graphql-type-json)).

**Example:**
```graphql 

interface Submission {
	id: ID! @unique
	text: String!
	author: User @relation(name: "SubmissionsByUser")
}

type Story implements Submission @model {
	id: ID! @unique
	title: String!
	text: String!
	author: User @relation(name: "SubmissionsByUser")
	likedBy: [User!] @connection @relation(name: "LikedSubmissions")
}

type Comment implements Submission @model {
	id: ID! @unique
	text: String!
	author: User @relation(name: "SubmissionsByUser")
	approved: Boolean @default(value: "true")
}

type User @model {
	id: ID! @unique
	email: String @unique
	submissions: [Submission!] @relation(name: "SubmissionsByUser")
	address: Address
	liked: [Submission!] @connection @relation(name: "LikedSubmissions")
}

type Address @model {
	id: ID! @unique
	city: String!
	user: User
}
