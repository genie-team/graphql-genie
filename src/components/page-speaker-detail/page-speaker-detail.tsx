import '@ionic/core';
import '@stencil/core';

import { Component, Prop } from '@stencil/core';
import { ConferenceData } from '../../providers/conference-data';

@Component({
  tag: 'page-speaker-detail',
  styleUrl: 'page-speaker-detail.css'
})
export class PageSpeakerDetail {
  private speaker: any;
  @Prop() speakerId: string;
  async componentWillLoad() {
    this.speaker = await ConferenceData.getSpeaker(this.speakerId);
  }
  render() {
    return [
      <ion-header>
        <ion-toolbar color="primary">
          <ion-buttons slot="start">
            <ion-back-button />
          </ion-buttons>
          <ion-title>{this.speaker.name}</ion-title>
        </ion-toolbar>
      </ion-header>,
      <ion-content class="outer-content">
        <ion-grid>
          <ion-row align-items-stretch>
            <ion-col col-10 push-1 col-sm-6 push-sm-3>
              <ion-card>
                <ion-card-content>
                  <img src={this.speaker.profilePic} alt={this.speaker.name} />
                  <ion-button fill="clear" size="small" color="twitter">
                    <ion-icon slot="icon-only" name="logo-twitter" />
                  </ion-button>
                  <ion-button fill="clear" size="small" color="github">
                    <ion-icon slot="icon-only" name="logo-github" />
                  </ion-button>
                  <ion-button fill="clear" size="small" color="instagram">
                    <ion-icon slot="icon-only" name="logo-instagram" />
                  </ion-button>
                  <p>{this.speaker.about}</p>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>
      </ion-content>
    ];
  }
}
