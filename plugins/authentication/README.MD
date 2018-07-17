<h1 align="center">
	<img width="128px" src="https://raw.githubusercontent.com/genie-team/graphql-genie/master/resources/logo.svg?sanitize=true" alt="GraphQL Genie Logo">
</h1>

# GraphQL Genie Authentication

[![npm version](https://img.shields.io/npm/v/graphql-genie-authentication.svg)](https://www.npmjs.com/package/graphql-genie-authentication)
[![npm](https://img.shields.io/npm/l/graphql-genie-authentication.svg)](https://github.com/genie-team/graphql-genie/blob/master/LICENSE)

Helps add authentication to your graphql-genie schema. Creates a `@auth` directive that allows role based authentication down to individual fields

### Installation
Assuming you already have [GraphQL Genie](https://github.com/genie-team/graphql-genie) installed.

`npm install graphql-genie-authentication` 

or 

`yarn add graphql-genie-authentication`

### Enable plugin

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

The auth directive looks like, where defaults are arguments to the plugin

```graphql
directive @auth(
	create: [Role] = [${defaultCreateRole}],
	read: [Role] = [${defaultReadRole}],
	update: [Role] = [${defaultUpdateRole}],
	delete: [Role] = [${defaultDeleteRole}]
) on OBJECT | FIELD_DEFINITION
```

### Arguments

`(defaultCreateRole = 'ADMIN', defaultReadRole = 'ADMIN', defaultUpdateRole = 'ADMIN', defaultDeleteRole = 'ADMIN'): GeniePlugin`

You can pass in the default required of each operation which will be used in you don't pass in the required role when using the directive


### Authentication Requirements 

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

And how the auth directive may be used with those roles.  

	Setting auth on a type will also wrap all the fields with the same requirements.

	Since auth fields have a default, when using on a field the default will override the type value, so set it again on the field even if it's the same as on tye type

```graphql
# Only users can create posts, anybody can read posts, only the person who created the post can update/delete it
type Post @auth(create: USER, read: ANY, update: OWNER, delete: OWNER) {
	id: ID! @unique
	title: String!
	text: String
	author: User @relation(name: "posts")
}

# Anyone can create users (aka signup), be able to see user info by default, can only update yourself, and only admins can delete
type User @auth(create: ANY, read: ANY, update: OWNER, delete: ADMIN) {
	id: ID! @unique
	username: String! @unique
	# don't let anyone read email
	email: String! @unique @auth(create: ANY, read: OWNER, update: OWNER, delete: ADMIN)
	# only admins can read password
	password: String! @auth(create: ANY, read: ADMIN, update: OWNER, delete: ADMIN)
	posts: [Post] @relation(name: "posts")
	# Only admins can alter roles, will need additional logic in authenticate function so users can only set themself to USER role
	roles: [Role] @default(value: "USER") @auth(create: ANY, read: ADMIN, update: ADMIN, delete: ADMIN)
}

```


All graphql requests must have a context with a property named `authenticate`. `authenticate` must be a function which returns (or resolves to) true if the operation is allowed. If the operation is not allowed either return/resolve to false or throw an error. 

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
* **allowedRoles: {create: string[]; read: string[]; update: string[]; delete: string[];}**
	* The configured roles allowed for this type/field
	* To get just the allowed roles for the current method just do `const allowedRolesForMethod: any[] = allowedRoles[method];`
* **record: object**
	* The record (without updates) being queried/mutated.
	* You may need to look at this if you have a role like `Owner` to see if the current user has permission
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


The function should also have any other constraint logic necessary, such as users not being able to create roles on themselves, or only set the author field on post to themselves
		
### Examples

See the [yoga redis example](https://github.com/genie-team/graphql-genie/tree/master/examples/graphql-yoga-redis-authentication) for session authentication with users stored in the database. Would be simple to adapt to returning a JWT on login as well

See the [yoga redis firebase example](https://github.com/genie-team/graphql-genie/tree/master/examples/graphql-yoga-redis-firebase-auth) for using firebase authentication to login and control access from an external JWT provider.

#### Thanks/Credit

Logo Icon made by [Freepik](http://www.freepik.com) from [www.flaticon.com](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)



