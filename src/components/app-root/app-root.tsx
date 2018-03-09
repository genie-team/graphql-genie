import '@ionic/core';
import '@stencil/core';

import { Component, Element } from '@stencil/core';
import { UserData } from '../../providers/user-data';

@Component({
  tag: 'app-root',
  styleUrl: 'app-root.css'
})
export class AppRoot {
  loggedIn = false;

  @Element() el: HTMLElement;

  appPages = [
    {
      title: 'Schedule',
      url: '/',
      icon: 'calendar'
    }, {
      title: 'Speakers',
      url: '/speaker-list',
      icon: 'contacts'
    }, {
      title: 'Map',
      url: '/map',
      icon: 'map'
    }, {
      title: 'About',
      url: '/about',
      icon: 'information-circle'
    }
  ];

  async componentDidLoad() {
    const hasSeenTutorial = await UserData.checkHasSeenTutorial();
    const component = hasSeenTutorial ? 'page-tabs' : 'page-tutorial';
    this.el.querySelector('ion-nav').push(component);
  }

  logout() {
    UserData.logout();
  }

  renderRouter() {
    return (
    <ion-router useHash={false}>
      <ion-route component="page-tabs">
        <ion-route path="/schedule" component="tab-schedule">
          <ion-route component="page-schedule"/>
          <ion-route path="/session/:sessionId" component="page-session" />
        </ion-route>

        <ion-route path="/speaker-list" component="tab-speaker">
          <ion-route component="page-speaker-list"/>
          <ion-route path="/session/:sessionId" component="page-session" params={{goback: 'speaker-list'}} />
          <ion-route path="/speaker/:speakerId" component="page-speaker-detail" params={{goback: 'speaker-list'}} />
        </ion-route>

        <ion-route path="/map" component="page-map"/>

        <ion-route path="/about" component="page-about"/>
      </ion-route>

      <ion-route path="/tutorial" component="page-tutorial"/>

      <ion-route path="/login" component="page-login"/>

      <ion-route path="/support" component="page-support"/>
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

                {this.appPages.map((p) =>
                  <ion-menu-toggle autoHide={false}>
                    <ion-item href={p.url}>
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
                      ? <ion-item href="account">
                          <ion-icon slot="start" name="person"></ion-icon>
                          <ion-label>
                            Account
                          </ion-label>
                        </ion-item>

                      : <ion-item href="login">
                          <ion-icon slot="start" name="log-in"></ion-icon>
                          <ion-label>
                            Login
                          </ion-label>
                        </ion-item>
                    }
                  </ion-menu-toggle>

                  <ion-menu-toggle autoHide={false}>
                    <ion-item href="support" tappable>
                      <ion-icon slot="start" name="help"></ion-icon>
                      <ion-label>
                        Support
                      </ion-label>
                    </ion-item>
                  </ion-menu-toggle>

                  <ion-menu-toggle autoHide={false}>
                    {this.loggedIn
                      ? <ion-item onClick={() => this.logout()} tappable>
                          <ion-icon slot="start" name="log-out"></ion-icon>
                          <ion-label>
                            Logout
                          </ion-label>
                        </ion-item>

                      : <ion-item href="signup" tappable>
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
                  <ion-item href="tutorial">
                    <ion-icon slot="start" name="hammer"></ion-icon>
                    <ion-label>Show Tutorial</ion-label>
                  </ion-item>
                </ion-menu-toggle>
              </ion-list>
            </ion-content>
          </ion-menu>

          <ion-nav swipeBackEnabled={false} main/>
        </ion-split-pane>
      </ion-app>
    );
  }
}
