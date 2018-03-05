import '@ionic/core';
import '@stencil/core';

import { Component } from '@stencil/core';

@Component({
  tag: 'app-menu',
  styleUrl: 'app-menu.css'
})
export class AppMenu {
  loggedIn = false;

  appPages = [
    {
      title: 'Schedule',
      url: '/app/tabs/(schedule:schedule)',
      icon: 'calendar'
    },
    {
      title: 'Speakers',
      url: '/app/tabs/(speakers:speakers)',
      icon: 'contacts'
    },
    { title: 'Map', url: '/app/tabs/(map:map)', icon: 'map' },
    {
      title: 'About',
      url: '/app/tabs/(about:about)',
      icon: 'information-circle'
    }
  ];

  selectTab() {

  }

  navigate() {

  }

  logout() {

  }

  openTutorial() {

  }

  render() {
    return (
      <ion-menu>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Menu</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>

          <ion-list>
            <ion-list-header>
              Navigate
            </ion-list-header>

            {this.appPages.map(p =>
              <ion-menu-toggle auto-hide={false}>
                <ion-item onClick={this.selectTab.bind(this)}>
                  <ion-icon slot="start" name={p.icon}></ion-icon>
                  <ion-label>
                    {p.title}
                  </ion-label>
                </ion-item>
              </ion-menu-toggle>
            )}
            </ion-list>

            <ion-list>
              <ion-list-header>
                Account
              </ion-list-header>

              <ion-menu-toggle auto-hide="false">
                {this.loggedIn
                  ? <ion-item onClick={this.navigate.bind(this)}>
                      <ion-icon slot="start" name="person"></ion-icon>
                      <ion-label>
                        Account
                      </ion-label>
                    </ion-item>

                  : <ion-item onClick={this.navigate.bind(this)}>
                      <ion-icon slot="start" name="log-in"></ion-icon>
                      <ion-label>
                        Login
                      </ion-label>
                    </ion-item>
                }
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <ion-item onClick={this.navigate.bind(this)}>
                  <ion-icon slot="start" name="help"></ion-icon>
                  <ion-label>
                    Support
                  </ion-label>
                </ion-item>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                {this.loggedIn
                  ? <ion-item onClick={this.logout.bind(this)}>
                      <ion-icon slot="start" name="log-out"></ion-icon>
                      <ion-label>
                        Logout
                      </ion-label>
                    </ion-item>

                  : <ion-item onClick={this.navigate.bind(this)}>
                      <ion-icon slot="start" name="person-add"></ion-icon>
                      <ion-label>
                        Signup
                      </ion-label>
                    </ion-item>
                  }
              </ion-menu-toggle>
          </ion-list>

          <ion-list>
            <ion-list-header>
              Tutorial
            </ion-list-header>
            <ion-menu-toggle auto-hide="false">
              <ion-item onClick={this.openTutorial.bind(this)}>
                <ion-icon slot="start" name="hammer"></ion-icon>
                <ion-label>Show Tutorial</ion-label>
              </ion-item>
            </ion-menu-toggle>
          </ion-list>
        </ion-content>

      </ion-menu>
    );
  }
}
