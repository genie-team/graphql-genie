import '@ionic/core';
import '@stencil/core';

import { Component } from '@stencil/core';

import { ConferenceData } from '../../providers/conference-data';


@Component({
  tag: 'page-speaker-list',
  styleUrl: 'page-speaker-list.css',
})
export class PageSpeakerList {
  speakers: any[] = [];

  async componentWillLoad() {
    this.speakers = await ConferenceData.getSpeakers();
    console.log('will load with speakers', this.speakers);
  }

  goToSessionDetail(session: any) {
    console.log('goToSessionDetail', session);
  }

  goToSpeakerDetail(speaker: any) {
    console.log('goToSpeakerDetail', speaker);
  }

  goToSpeakerTwitter(speaker: any) {
    console.log('goToSpeakerTwitter', speaker);
  }

  openSpeakerShare(speaker: any) {
    console.log('openSpeakerShare', speaker);
  }

  openContact(speaker: any) {
    console.log('openContact', speaker);
  }


  render() {
    console.log("in render with", this.speakers);

    return [
      <ion-header>
        <ion-toolbar color="primary">
          <ion-buttons slot="start">
            <ion-menu-button></ion-menu-button>
          </ion-buttons>
          <ion-title>Speakers</ion-title>
        </ion-toolbar>
      </ion-header>,

      <ion-content class="outer-content">
        <ion-list>
          <ion-grid>
            <ion-row align-items-stretch>

              {this.speakers.map(speaker =>
                <ion-col col-12 col-md-6 align-self-stretch>
                  <ion-card class="speaker-card">
                    <ion-card-header>
                      <ion-item detail-none onClick={() => this.goToSpeakerDetail(speaker)}>
                        <ion-avatar slot="start">
                          <img src={speaker.profilePic} alt="Speaker profile pic"/>
                        </ion-avatar>
                        {speaker.name}
                      </ion-item>
                    </ion-card-header>

                    <ion-card-content>
                      <ion-list>
                        {speaker.sessions.map(session =>
                          <ion-item onClick={() => this.goToSessionDetail(session)}>
                            <h3>{session.name}</h3>
                          </ion-item>
                        )}

                        <ion-item onClick={() => this.goToSpeakerDetail(speaker)}>
                          <h3>About {speaker.name}</h3>
                        </ion-item>
                      </ion-list>
                    </ion-card-content>

                    <ion-row no-padding justify-content-center>
                      <ion-col col-auto text-left>
                        <ion-button fill="clear" size="small" color="primary" onClick={() => this.goToSpeakerTwitter(speaker)}>
                          <ion-icon name="logo-twitter" slot="start"></ion-icon>
                          Tweet
                        </ion-button>
                      </ion-col>
                      <ion-col col-auto text-center>
                        <ion-button fill="clear" size="small" color="primary" onClick={() => this.openSpeakerShare(speaker)}>
                          <ion-icon name='share-alt' slot="start"></ion-icon>
                          Share
                        </ion-button>
                      </ion-col>
                      <ion-col col-auto text-right>
                        <ion-button fill="clear" size="small" color="primary" onClick={() => this.openContact(speaker)}>
                          <ion-icon name='chatboxes' slot="start"></ion-icon>
                          Contact
                        </ion-button>
                      </ion-col>
                    </ion-row>
                  </ion-card>
                </ion-col>
              )}

            </ion-row>
          </ion-grid>
        </ion-list>
      </ion-content>
    ];
  }
}
