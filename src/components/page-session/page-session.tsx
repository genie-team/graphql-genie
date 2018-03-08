import { Component, Prop } from '@stencil/core';
import { ConferenceData } from '../../providers/conference-data';

@Component({
  tag: 'page-session',
  styleUrl: 'page-session.css',
})
export class PageSession {

  private session: any;
  @Prop() sessionId: string;

  async componentWillLoad() {
    this.session = await ConferenceData.getSession(this.sessionId);
  }

  render() {
    return [
      <ion-header>
        <ion-toolbar color="primary">
          <ion-buttons slot="start">
            <ion-back-button defaultHref="/"/>
          </ion-buttons>
          <ion-title>{this.session.name}</ion-title>
        </ion-toolbar>
      </ion-header>,

      <ion-content>
        <ion-list>
          <ion-item>
            <ion-label>Name</ion-label>
            <ion-note slot="end">{this.session.name}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label>Time start</ion-label>
            <ion-note slot="end">{this.session.timeStart}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label>Time end</ion-label>
            <ion-note slot="end">{this.session.timeEnd}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label>Location</ion-label>
            <ion-note slot="end">{this.session.location}</ion-note>
          </ion-item>
        </ion-list>

        <ion-list>
          <ion-list-header>Tracks</ion-list-header>
          {this.session.tracks.map(t => <ion-item>{t}</ion-item>)}
        </ion-list>
      </ion-content>
    ];
  }
}
