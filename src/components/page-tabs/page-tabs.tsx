import '@ionic/core';
import '@stencil/core';

import { Component } from '@stencil/core';

@Component({
  tag: 'page-tabs',
  styleUrl: 'page-tabs.css',
})
export class PageTabs {

  render() {
    return [
      <ion-tabs>
        <ion-tab title="Schedule" icon="calendar">
          <ion-nav lazy={true} root="page-schedule"></ion-nav>
        </ion-tab>
        <ion-tab title="Speakers" icon="contacts">
          <ion-nav lazy={true} root="page-speaker-list"></ion-nav>
        </ion-tab>
        <ion-tab title="Map" icon="map">
          <ion-nav lazy={true} root="page-map"></ion-nav>
        </ion-tab>
        <ion-tab title="About" icon="information-circle">
          <ion-nav lazy={true} root="page-about"></ion-nav>
        </ion-tab>
      </ion-tabs>
    ];
  }
}
