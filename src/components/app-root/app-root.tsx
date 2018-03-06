import '@ionic/core';
import '@stencil/core';

import { Component } from '@stencil/core';

@Component({
  tag: 'app-root',
  styleUrl: 'app-root.css'
})
export class AppRoot {
  rootPage: string;
  loggedIn = false;

  appPages = [
    {
      title: 'Schedule',
      url: 'page-schedule',
      icon: 'calendar'
    }, {
      title: 'Speakers',
      url: 'page-speaker-list',
      icon: 'contacts'
    }, {
      title: 'Map',
      url: 'page-map',
      icon: 'map'
    }, {
      title: 'About',
      url: 'page-about',
      icon: 'information-circle'
    }
  ];

  componentWillLoad() {
    this.rootPage = 'page-tabs';
  }

  selectTab(index: number, url: string) {
    console.log('selecting tab', index, url);
  }

  navigate(url: string) {
    console.log('navigate to', url);
  }

  logout() {

  }

  openTutorial() {

  }

  renderRouter() {
    return (
    <ion-router>
      <ion-route component="page-tabs">

        <ion-route component="tab-schedule">
          <ion-route component="page-schedule"/>
        </ion-route>

        <ion-route path="/speaker-list" component="tab-speaker">
          <ion-route component="page-speaker-list"/>
        </ion-route>

        <ion-route path="/map" component="page-map"/>

        <ion-route path="/about" component="page-about"/>
      </ion-route>

      <ion-route path="/tutorial" component="page-tutorial"/>
    </ion-router>
    );
  }

  // TODO ion-menu should be split out
  render() {
    return (
      <ion-app>
        {this.renderRouter()}
        <ion-split-pane>
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

                {this.appPages.map((p, i) =>
                  <ion-menu-toggle autoHide={false}>
                    <ion-item onClick={() => this.selectTab(i, p.url)}>
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

                  <ion-menu-toggle autoHide={false}>
                    {this.loggedIn
                      ? <ion-item onClick={() => this.navigate('page-account')}>
                          <ion-icon slot="start" name="person"></ion-icon>
                          <ion-label>
                            Account
                          </ion-label>
                        </ion-item>

                      : <ion-item onClick={() => this.navigate('page-login')}>
                          <ion-icon slot="start" name="log-in"></ion-icon>
                          <ion-label>
                            Login
                          </ion-label>
                        </ion-item>
                    }
                  </ion-menu-toggle>

                  <ion-menu-toggle autoHide={false}>
                    <ion-item onClick={() => this.navigate('page-support')}>
                      <ion-icon slot="start" name="help"></ion-icon>
                      <ion-label>
                        Support
                      </ion-label>
                    </ion-item>
                  </ion-menu-toggle>

                  <ion-menu-toggle autoHide={false}>
                    {this.loggedIn
                      ? <ion-item onClick={() => this.logout()}>
                          <ion-icon slot="start" name="log-out"></ion-icon>
                          <ion-label>
                            Logout
                          </ion-label>
                        </ion-item>

                      : <ion-item onClick={() => this.navigate('page-signup')}>
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
                <ion-menu-toggle autoHide={false}>
                  <ion-item onClick={() => this.openTutorial()}>
                    <ion-icon slot="start" name="hammer"></ion-icon>
                    <ion-label>Show Tutorial</ion-label>
                  </ion-item>
                </ion-menu-toggle>
              </ion-list>
            </ion-content>
          </ion-menu>

          <ion-nav swipeBackEnabled={false} main></ion-nav>
        </ion-split-pane>
      </ion-app>
    );
  }
}
