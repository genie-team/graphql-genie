### Run Server
`npm install`

create config.json at src/config.json. Add your firebase service account info with firebase key. 
See the "Add Firebase to your app" section in the [admin setup guide](https://firebase.google.com/docs/admin/setup) to get your service account.
E.G
```
{
	"firebase": {
		"type": "service_account",
		"project_id": "...",
		"private_key_id": "...",
		"private_key": "...",
		...etc	
	}
}
```

`npm run build`

`cd client`

`npm run build`

`cd ..`

`npm run start`

Go to localhost:4000

Login

The page will then show your Firebase JWT. Copy that and go to localhost:4400/playground. Click "HTTP Headers" and paste the authentication header like so.

```json
{
"authorization": "Bearer FirebaseJWTkeyAAAAAAAA"
}
```

Note you may need to change this line `server.express.use(express.static(publicPath));` if you are running from somewhere other than this project root or the graphql-genie root. publicPath needs to point to the /public directory
