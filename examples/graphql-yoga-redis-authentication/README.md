### Run Server
`npm install`

`npm run build`

`npm run start`

Go to localhost:4000

In Graphql Playground click the settings cog and change `request.credentials` to `include` or `same-origin` for authentication functionality to work

Run the query
```graphql
mutation {
  login(identifier: "admin", password: "admin")
}
```