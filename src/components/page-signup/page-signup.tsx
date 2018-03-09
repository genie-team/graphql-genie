import '@ionic/core';
import '@stencil/core';

import { Component } from '@stencil/core';


@Component({
  tag: 'page-signup',
  styleUrl: 'page-signup.css',
})
export class PageSignup {
  username = {
    valid: false
  };
  password = {
    valid: false
  };
  submitted = false;

  onSignup() {
    console.log('clicked signup');
  }

  render() {
    return [
      <ion-header>
        <ion-toolbar color="primary">
          <ion-buttons slot="start">
            <ion-menu-button></ion-menu-button>
          </ion-buttons>
          <ion-title>Signup</ion-title>
        </ion-toolbar>
      </ion-header>,

      <ion-content>

        <div class="signup-logo">
          <img src="assets/img/appicon.svg" alt="Ionic Logo"/>
        </div>

        <form novalidate>
          <ion-list no-lines>
            <ion-item>
              <ion-label stacked color="primary">Username</ion-label>
              <ion-input name="username" type="text" required>
              </ion-input>
            </ion-item>
            <ion-text color="danger">
              <p hidden={this.username.valid || this.submitted === false} padding-left>
                Username is required
              </p>
            </ion-text>

            <ion-item>
              <ion-label stacked color="primary">Password</ion-label>
              <ion-input name="password" type="password" required>
              </ion-input>
            </ion-item>
            <ion-text color="danger">
              <p hidden={this.password.valid || this.submitted === false} padding-left>
                Password is required
              </p>
            </ion-text>
          </ion-list>

          <div padding>
            <ion-button onClick={() => this.onSignup()} type="submit" expand="block">Create</ion-button>
          </div>
        </form>

      </ion-content>


    ];
  }
}
