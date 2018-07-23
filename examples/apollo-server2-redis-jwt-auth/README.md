### Run Server
`npm install`

`npm run build`

`npm run start`

Go to localhost:4000



Run the query
```graphql
mutation {
  login(identifier: "admin", password: "admin")
}
```

You will get back a jwt
```graphql
{
  "data": {
    "login": "JWT.JWT.KEY"
  }
}
```

Click "HTTP Headers" and paste the authentication header like so.

```json
{
"authorization": "Bearer JWT.JWT.KEY"
}
```