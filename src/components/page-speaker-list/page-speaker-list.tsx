import '@ionic/core';
import '@stencil/core';

import { ActionSheetController } from '@ionic/core';
import { Component, Prop } from '@stencil/core';

import { ConferenceData } from '../../providers/conference-data';


@Component({
  tag: 'page-speaker-list',
  styleUrl: 'page-speaker-list.css',
})
export class PageSpeakerList {
  speakers: any[] = [];

  @Prop({ connect: 'ion-action-sheet-controller' }) actionSheetCtrl: ActionSheetController;

  async componentWillLoad() {
    this.speakers = await ConferenceData.getSpeakers();
  }

  goToSpeakerDetail(speaker: any) {
    console.log('goToSpeakerDetail', speaker);
  }

  goToSpeakerTwitter(speaker: any) {
    console.log('goToSpeakerTwitter', speaker);
  }

  async openSpeakerShare(speaker: any) {
    console.log('open speaker', speaker);

    const actionSheet = await this.actionSheetCtrl.create({
      title: 'Share ' + speaker.name,
      buttons: [{
        text: 'Copy Link',
        handler: () => {
          console.log('Copy link clicked on https://twitter.com/' + speaker.twitter);
          if ( (window as any)['cordova'] && (window as any)['cordova'].plugins.clipboard) {
            (window as any)['cordova'].plugins.clipboard.copy(
              'https://twitter.com/' + speaker.twitter
            );
          }
        }
      },
      {
        text: 'Share via ...'
      },
      {
        text: 'Cancel',
        role: 'cancel'
      }]
    });

    actionSheet.present();
  }

  openContact(speaker: any) {
    console.log('openContact', speaker);
  }


  render() {
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
                          <ion-item href={`/session/${session.id}`}>
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
                          <ion-icon name="share-alt" slot="start"></ion-icon>
                          Share
                        </ion-button>
                      </ion-col>
                      <ion-col col-auto text-right>
                        <ion-button fill="clear" size="small" color="primary" onClick={() => this.openContact(speaker)}>
                          <ion-icon name="chatboxes" slot="start"></ion-icon>
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
