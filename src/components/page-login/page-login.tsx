import '@ionic/core';
import '@stencil/core';

import { Component } from '@stencil/core';


@Component({
  tag: 'page-login',
  styleUrl: 'page-login.css',
})
export class PageLogin {
  username = {
    valid: false
  };
  password = {
    valid: false
  };
  submitted = false;

  onLogin() {
    console.log('Clicked login');
  }

  onSignup() {
    console.log('Clicked signup');
  }

  render() {
    return [
      <ion-header>
        <ion-toolbar color="primary">
          <ion-buttons slot="start">
            <ion-menu-button></ion-menu-button>
          </ion-buttons>

          <ion-title>Login</ion-title>
        </ion-toolbar>
      </ion-header>,

      <ion-content>
        <div class="login-logo">
          <img src="assets/img/appicon.svg" alt="Ionic logo"/>
        </div>

        <form novalidate>
          <ion-list no-lines>
            <ion-item>
              <ion-label stacked color="primary">Username</ion-label>
              <ion-input name="username" type="text" spellcheck={false} autocapitalize="off" required></ion-input>
            </ion-item>

            <ion-text color="danger">
              <p hidden={this.username.valid || this.submitted === false} padding-left>
                Username is required
              </p>
            </ion-text>

            <ion-item>
              <ion-label stacked color="primary">Password</ion-label>
              <ion-input name="password" type="password" required></ion-input>
            </ion-item>

            <ion-text color="danger">
              <p hidden={this.password.valid || this.submitted === false} padding-left>
                Password is required
              </p>
            </ion-text>
          </ion-list>

          <ion-row responsive-sm>
            <ion-col>
              <ion-button onClick={() => this.onLogin()} type="submit" expand="block">Login</ion-button>
            </ion-col>
            <ion-col>
              <ion-button onClick={() => this.onSignup()} color="light" expand="block">Signup</ion-button>
            </ion-col>
          </ion-row>
        </form>

      </ion-content>

    ];
  }
}
