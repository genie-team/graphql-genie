import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';
import gql from 'graphql-tag';
declare var firebase;
window['logout'] = () => {
	firebase.auth().signOut();
	location.reload();
};
const initApp = () => {
	firebase.auth().onAuthStateChanged(function (user) {
		console.log('state changed', !!user);
		if (user) {
			user.getIdToken().then(function (accessToken) {

				document.getElementById('firebaseui-auth-container').innerHTML = `
					<strong>Go to <a href="/playground">/playground</a> and set HTTP Headers to</strong>
					<br/><br/>
					{<br/>
						"authorization": "Bearer ${accessToken}"<br/>
					}<br/><br/><br/>
					<a href="#" onclick="logout()"> Logout </a>
				`;

				localStorage.setItem('token', accessToken);
				const httpLink = createHttpLink({
					uri: '/graphql',
				});

				const authLink = setContext((_, { headers }) => {
					// get the authentication token from local storage if it exists
					const token = localStorage.getItem('token');
					// return the headers to the context so httpLink can read them
					return {
						headers: {
							...headers,
							authorization: token ? `Bearer ${token}` : '',
						}
					};
				});

				console.log('setup client');
				const client = new ApolloClient({
					link: authLink.concat(httpLink),
					cache: new InMemoryCache()
				});
				client.query({
					query: gql`
					query {
						users {
							id
							name
							email
						}
					}
				`,
				})
					.then(data => console.log(data))
					.catch(error => console.error(error));
			});

		}

	});
};

window.addEventListener('load', function() {
	initApp();
});
