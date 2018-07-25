<h1 align="center">
	<img width="128px" src="https://raw.githubusercontent.com/genie-team/graphql-genie/master/resources/logo.svg?sanitize=true" alt="GraphQL Genie Logo">
</h1>


- [GraphQL Genie Authentication](#graphql-genie-authentication)
	- [Installation](#installation)
	- [Enable plugin](#enable-plugin)
		- [Arguments](#arguments)
	- [Authentication Requirements](#authentication-requirements)
		- [Role enum](#role-enum)
		- [@auth directive](#auth-directive)
		- [authenticate function](#authenticate-function)
	- [Examples](#examples)
	- [Thanks/Credit](#thankscredit)


# GraphQL Genie Authentication

[![npm version](https://img.shields.io/npm/v/graphql-genie-authentication.svg)](https://www.npmjs.com/package/graphql-genie-authentication)
[![npm](https://img.shields.io/npm/l/graphql-genie-authentication.svg)](https://github.com/genie-team/graphql-genie/blob/master/LICENSE)

Helps add authentication to your graphql-genie schema. Creates a `@auth` directive that allows role based access control down to individual fields

## Installation
Assuming you already have [GraphQL Genie](https://github.com/genie-team/graphql-genie) installed.

`npm install graphql-genie-authentication` 

or 

`yarn add graphql-genie-authentication`

## Enable plugin

```js
import { FortuneOptions, GraphQLGenie } from 'graphql-genie';
import authPlugin from 'graphql-genie-authentication';


// typedefs must have an enum named Role
const genie = new GraphQLGenie(...args);

await genie.init();
// genie.use can be called before or after init
await genie.use(authPlugin()); 

//get the GraphQLSchema and use it with any other tools you need, such as subscriptions-transport-ws
const schema = genie.getSchema();
```

The plugin will create the auth directive and setup the necessary hooks/resolvers to allow you to decide whether or not to allow a specific request

The auth directive is defined as shown below, where defaults are arguments to the plugin.

There is also an optional rules argument, these are passed along to your authenticate function to allow additional constraints you might want to manually impose on the type or field but still define in your schema.

```graphql
directive @auth(
	create: [Role] = [${defaultCreateRole}],
	read: [Role] = [${defaultReadRole}],
	update: [Role] = [${defaultUpdateRole}],
	delete: [Role] = [${defaultDeleteRole}]
	rules: [String!]
) on OBJECT | FIELD_DEFINITION
```

### Arguments

`(defaultCreateRole = 'ADMIN', defaultReadRole = 'ADMIN', defaultUpdateRole = 'ADMIN', defaultDeleteRole = 'ADMIN'): GeniePlugin`

You can pass in the default required of each operation which will be used in you don't pass in the required role when using the directive. If you don't provide an argument 'ADMIN' will be the default, so make sure that is one of the roles.


## Authentication Requirements 


### Role enum

Your schema must have an enum named "Role". These will then be used to define necessary roles on CRUD operations. An example of roles you may want to setup.

```graphql
enum Role {
	# Open to all requests
	ANY
	# Must be logged in
	USER
	# User must have created/be the type
	OWNER
	ADMIN
}
```

### @auth directive

How the @auth directive may be used with those roles.  

**Note:** Setting auth on a type will also wrap all the fields with the same requirements.

**Note:** Since auth fields have a default, when using on a field the default will override the type value, so set it again on the field even if it's the same as on tye type

```graphql
# Only users can create posts, anybody can read posts, only the person who created the post can update/delete it
type Post @auth(create: USER, read: ANY, update: OWNER, delete: OWNER) {
	id: ID! @unique
	title: String!
	text: String
	# Set a rule of "SELF" here that we can look for in our authenticate function so users aren't allowed to change it to other users
	author: User @relation(name: "posts") @auth(create: USER, read: ANY, update: OWNER, delete: OWNER, rules: "SELF")
}

# Anyone can create users (aka signup), be able to see user info by default, can only update yourself, and only admins can delete
type User @auth(create: ANY, read: ANY, update: OWNER, delete: ADMIN) {
	id: ID! @unique
	username: String! @unique
	# only users can see their own email, it's not public
	email: String! @unique @auth(create: ANY, read: OWNER, update: OWNER, delete: ADMIN)
	# only admins can read password
	password: String! @auth(create: ANY, read: ADMIN, update: OWNER, delete: ADMIN)
	posts: [Post] @relation(name: "posts")
	# Only admins can alter roles, will need additional logic in authenticate function so users can only set themself to USER role
	# So we set only:USER in the rules so we can find that later in our authenticate function
	roles: [Role] @default(value: "USER") @auth(create: ANY, read: ADMIN, update: ADMIN, delete: ADMIN, rules: "only:USER")
}

```

### authenticate function

All graphql requests must have a context with a property named `authenticate`. `authenticate` must be a function which returns (or resolves to) true if the operation is allowed. If the operation is not allowed either return/resolve to false or throw an error. 

This function is where you will check the current logged in users role (or however else you want to authenticate) against the requirments setup by your schema.

An example setting up context with GraphQL Yoga
```typescript
const server = new GraphQLServer({
	schema,
	context: req => ({
		...req,
		authenticate: (method, allowedRoles, record, updates, typeName, fieldName) => {
			return true;
		}
	})
});
```
The authenticate function recieves the following.

* **method: String**: 
	* The CRUD operation being performed
	* 'create', 'read', 'update' or 'delete'
* **allowedRoles: {create: string[]; read: string[]; update: string[]; delete: string[]; rules: string[]}**
	* The configured roles allowed and rules for this type/field
	* To get just the allowed roles for the current method just do `const allowedRolesForMethod: string[] = allowedRoles[method];`
	* To get rules `const rules: string[] = allowedRoles.rules;`
* **records: object[]**
	* The records (without updates) being queried/mutated.
	* You may need to look at this if you have a role like `Owner` to see if the current user has permission

* **filterRecords: object[]**
  * In cases where records are obtained as part of filtering/finding data but aren't part of the main record they are in this argument. 
	* This may contain additional info necessary when deciding if a read query is allowed when nested filtering is used in the `where` of a query
	* See the `getUserIDsOfRequestedData` function [here](https://github.com/genie-team/graphql-genie/blob/master/examples/apollo-server2-redis-jwt-auth/src/main.ts) for an example of how this might be used.

* **updates: {id: ID, replace: {}, push: {}, pull: {}}**
	* example
		```{
		// ID being updated
		id: 1,

		// Values being replaced
		replace: { name: 'Bob' },

		// Values (if a scalar type) or IDs (if a object type) being pushed to a list field
		push: { posts: 1 },

		// Values (if a scalar type) or IDs (if a object type) being removed from a list field
		pull: { posts: [ 2, 3 ] },
		```
* **typeName: string**
	* The type being queried/mutated.
* **fieldName: string**
	* The field being queried/mutated.
	* May be null if the check is just on the type
* **isFromFilter: boolean**
	* true if the authentication request is a result of a filter, such as checking if a user exists with an email.


The function should also have any other constraint logic necessary, such as users not being able to create roles on themselves, or only set the author field on post to themselves
		
## Examples

See the [apollo server 2 redis jwt example](https://github.com/genie-team/graphql-genie/tree/master/examples/apollo-server2-redis-jwt-auth) for JWT authentication with users stored in the database. Uses Apollo Server 2.

See the [yoga redis example](https://github.com/genie-team/graphql-genie/tree/master/examples/graphql-yoga-redis-authentication) for session authentication with users stored in the database. Uses GraphQL Yoga

See the [yoga redis firebase example](https://github.com/genie-team/graphql-genie/tree/master/examples/graphql-yoga-redis-firebase-auth) for using firebase authentication to login and control access from an external JWT provider. Uses GraphQL Yoga.


## Thanks/Credit

Logo Icon made by [Freepik](http://www.freepik.com) from [www.flaticon.com](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)



