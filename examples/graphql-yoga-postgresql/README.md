### Run Server
`yarn install`

create config.json at src/config.json. Add a postgres url such as from elephantsql
```json
{
	"postgresURL": "postgres://user:@stampy.db.elephantsql.com"
}
```
`yarn run build`
`yarn run start`