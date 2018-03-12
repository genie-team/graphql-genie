import '@ionic/core';
import '@stencil/core';

import { Component, Event, EventEmitter, Prop, State } from '@stencil/core';
import { AlertController, NavControllerBase } from '@ionic/core';
import { UserData } from '../../providers/user-data';


@Component({
  tag: 'page-account',
})
export class PageAccount {

  @State() user;
  @Prop({ connect: 'ion-nav' }) nav: NavControllerBase;
  @Prop({ connect: 'ion-alert-controller' }) alertCtrl: AlertController;
  @Event() userDidLogOut: EventEmitter;

  componentDidLoad() {
    this.getUser();
  }

  updatePicture() {
    console.log('Clicked to update picture');
  }

  async getUser() {
    this.user = await UserData.getUsername();
  }

  changePassword() {
    console.log('Clicked to change password');
  }

  async logout() {
    const navCtrl: NavControllerBase = await (this.nav as any).componentOnReady();
    await UserData.logout();
    this.userDidLogOut.emit({ loginStatus: false });
    navCtrl.setRoot('page-tabs', null, { animate: true, direction: 'forward' });
  }

  async support() {
    const navCtrl: NavControllerBase = await (this.nav as any).componentOnReady();
    navCtrl.setRoot('page-support');
  }

  async changeUsername() {
    const alert = await this.alertCtrl.create({
      title: 'Change Username',
      inputs: [
        {
          type: 'text',
          name: 'username',
          id: 'userName',
          placeholder: 'username',
          value: this.user
        },

      ],
      buttons: [
        { text: 'Cancel' },
        {
          text: 'Ok',
          handler: (data) => {
            UserData.setUsername(data.username);
            this.getUser();
          }
        }
      ]
    });
    alert.present();
  }

  render() {
    return [
      <ion-header>
        <ion-toolbar color="primary">
          <ion-buttons slot="start">
            <ion-menu-button></ion-menu-button>
            <ion-back-button></ion-back-button>
          </ion-buttons>

          <ion-title>Account</ion-title>
        </ion-toolbar>
      </ion-header>,

      <ion-content>

        <div padding-top text-center >
          <img src="http://www.gravatar.com/avatar?d=mm&s=140" alt="avatar" />
          <h2>{this.user}</h2>
          <ion-list>
            <ion-item onClick={() => this.updatePicture()}>Update Picture</ion-item>
            <ion-item onClick={() => this.changeUsername()}>Change Username</ion-item>
            <ion-item onClick={() => this.changePassword()}>Change Password</ion-item>
            <ion-item onClick={() => this.support()}>Support</ion-item>
            <ion-item onClick={() => this.logout()}>Logout</ion-item>
          </ion-list>
        </div>
      </ion-content>

    ];
  }
}
