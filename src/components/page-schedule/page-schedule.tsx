import '@ionic/core';
import '@stencil/core';

import { Component, Element, Listen, Prop, State } from '@stencil/core';

import { ConferenceData } from '../../providers/conference-data';

import { UserData } from '../../providers/user-data';


@Component({
  tag: 'page-schedule',
  styleUrl: 'page-schedule.css',
})
export class PageSchedule {
  excludeTracks: any = [];
  dayIndex = 0;
  scheduleList: HTMLIonListElement;
  fab: HTMLIonFabElement;

  @Element() el: any;

  @State() groups: any = [];

  @State() shownSessions: any = [];

  @State() segment = 'all';

  @State() queryText = '';

  @Prop({ connect: 'ion-alert-controller' }) alertCtrl: HTMLIonAlertControllerElement;

  @Prop({ connect: 'ion-loading-controller' }) loadingCtrl: HTMLIonLoadingControllerElement;

  @Prop({ connect: 'ion-modal-controller' }) modalCtrl: HTMLIonModalControllerElement;


  componentWillLoad() {
    this.updateSchedule();
  }

  componentDidLoad() {
    this.scheduleList = this.el.querySelector('#scheduleList');
    this.fab = this.el.querySelector('#socialFab');
  }

  @Listen('ionChange')
  segmentChanged(event: any) {
    this.segment = event.target.value;
    this.updateSchedule();
  }

  @Listen('ionInput')
  searchbarChanged(event: any) {
    this.queryText = event.target.value;
    this.updateSchedule();
  }

  @Listen('body:ionModalDidDismiss')
  modalDidDismiss(event: CustomEvent) {
    if (event) {
      this.excludeTracks = event.detail.data;
      this.updateSchedule();
    }
  }

  @Listen('body:ionLoadingWillDismiss')
  loadingWillDismiss() {
    this.fab.close();
  }

  async updateSchedule() {
    // Close any open sliding items when the schedule updates
    if (this.scheduleList) {
      this.scheduleList.closeSlidingItems();
    }

    const data = await ConferenceData.getTimeline(this.dayIndex, this.queryText, this.excludeTracks, this.segment);
    this.shownSessions = data.shownSessions;
    this.groups = data.groups;

    this.el.forceUpdate();
  }

  async presentFilter() {
    const modal = await this.modalCtrl.create({
      component: 'page-schedule-filter',
      data: { excludedTracks: this.excludeTracks }
    });
    await modal.present();
  }

  async addFavorite(session: any) {
    if (UserData.hasFavorite(session.name)) {
      // oops, this session has already been favorited, prompt to remove it
      this.removeFavorite(session, 'Favorite already added');
    } else {
      // remember this session as a user favorite
      UserData.addFavorite(session.name);

      // create an alert instance
      const alert = await this.alertCtrl.create({
        title: 'Favorite Added',
        buttons: [{
          text: 'OK',
          handler: () => {
            // close the sliding item
            this.scheduleList.closeSlidingItems();
            this.updateSchedule();
          }
        }]
      });

      // now present the alert
      alert.present();
    }
  }

  async removeFavorite(session: any, title: string) {
    const alert = await this.alertCtrl.create({
      title: title,
      message: 'Would you like to remove this session from your favorites?',
      buttons: [
        {
          text: 'Cancel',
          handler: () => {
            // they clicked the cancel button, do not remove the session
            // close the sliding item and hide the option buttons
            this.scheduleList.closeSlidingItems();
          }
        },
        {
          text: 'Remove',
          handler: () => {
            // they want to remove this session from their favorites
            UserData.removeFavorite(session.name);
            this.updateSchedule();
          }
        }
      ]
    });
    // now present the alert on top of all other content
    alert.present();
  }

  async openSocial(social: string) {
    this.toggleList();
    const loading = await this.loadingCtrl.create({
      content: `Posting to ${social}`,
      duration: (Math.random() * 1000) + 500
    });

    loading.present();
  }

  toggleList() {
    const fabButton = this.fab.querySelector('ion-fab-button');
    fabButton.activated = !fabButton.activated;

    const fabList = this.fab.querySelector('ion-fab-list');
    fabList.activated = !fabList.activated;
  }

  render() {
    return [
      <ion-header>
        <ion-toolbar color="primary">
          <ion-buttons slot="start">
            <ion-menu-button></ion-menu-button>
          </ion-buttons>

          <ion-segment value={this.segment} color="light">
            <ion-segment-button value="all">
              All
            </ion-segment-button>
            <ion-segment-button value="favorites">
              Favorites
            </ion-segment-button>
          </ion-segment>

          <ion-buttons slot="end">
            <ion-button onClick={() => this.presentFilter()}>
              <ion-icon slot="icon-only" name="options"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>

        <ion-toolbar color="primary">
          <ion-searchbar value={this.queryText} placeholder="Search">
          </ion-searchbar>
        </ion-toolbar>
      </ion-header>,

      <ion-content>
        <ion-list id="scheduleList" hidden={this.shownSessions === 0}>
          {this.groups.map(group =>
            <ion-item-group hidden={group.hide}>
              <ion-item-divider class="sticky">
                <ion-label>
                  {group.time}
                </ion-label>
              </ion-item-divider>

              {group.sessions.map(session =>
              <ion-item-sliding class={{[`item-sliding-track-${session.tracks[0].toLowerCase()}`]: true, 'item-sliding-track': true}} hidden={session.hide}>
              <ion-item href={`/schedule/session/${session.id}`}>
                  <ion-label>
                    <h3>{session.name}</h3>
                    <p>
                      {session.timeStart} &ndash; {session.timeEnd} &mdash; {session.location}
                    </p>
                  </ion-label>
                </ion-item>
                <ion-item-options>
                  {session.isFavorite === false
                    ? <ion-item-option color="favorite" onClick={() => this.addFavorite(session)}>
                        Favorite
                      </ion-item-option>

                    : <ion-item-option color="danger" onClick={() => this.removeFavorite(session, 'Remove Favorite')}>
                      Remove
                    </ion-item-option>
                  }

                </ion-item-options>
              </ion-item-sliding>
              )}
            </ion-item-group>
          )}
        </ion-list>

        <ion-list-header hidden={this.shownSessions > 0}>
          No Sessions Found
        </ion-list-header>

        <ion-fab id="socialFab" vertical="bottom" horizontal="end" slot="fixed">
          <ion-fab-button onClick={() => this.toggleList()}>
            <ion-icon name="share"></ion-icon>
          </ion-fab-button>

          <ion-fab-list side="top">
            <ion-fab-button color="vimeo" onClick={() => this.openSocial('Vimeo')}>
              <ion-icon name="logo-vimeo"></ion-icon>
            </ion-fab-button>
            <ion-fab-button color="google" onClick={() => this.openSocial('Google+')}>
              <ion-icon name="logo-googleplus"></ion-icon>
            </ion-fab-button>
            <ion-fab-button color="twitter" onClick={() => this.openSocial('Twitter')}>
              <ion-icon name="logo-twitter"></ion-icon>
            </ion-fab-button>
            <ion-fab-button color="facebook" onClick={() => this.openSocial('Facebook')}>
              <ion-icon name="logo-facebook"></ion-icon>
            </ion-fab-button>
          </ion-fab-list>
        </ion-fab>
      </ion-content>
    ];
  }
}
