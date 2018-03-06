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
        <ion-tab title="Schedule" icon="calendar" name="tab-schedule">
          <ion-nav/>
        </ion-tab>
        <ion-tab title="Speakers" icon="contacts" name="tab-speaker">
          <ion-nav/>
        </ion-tab>
        <ion-tab title="Map" icon="map" component="page-map"/>
        <ion-tab title="About" icon="information-circle" component="page-about"/>
      </ion-tabs>
    ];
  }
}
