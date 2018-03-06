import '@ionic/core';
import '@stencil/core';

import { Component, Element, Prop } from '@stencil/core';

import { ConferenceData } from '../../providers/conference-data';

declare var google: any;

@Component({
  tag: 'page-map',
  styleUrl: 'page-map.css',
})
export class PageMap {
  @Element() private el: HTMLElement;

  @Prop({ context: 'confData' }) confData: ConferenceData;

  componentDidLoad() {
    this.confData.getMap().subscribe((mapData: any) => {
      const mapEle = this.el.querySelector('map-canvas');

      const map = new google.maps.Map(mapEle, {
        center: mapData.find((d: any) => d.center),
        zoom: 16
      });

      mapData.forEach((markerData: any) => {
        const infoWindow = new google.maps.InfoWindow({
          content: `<h5>${markerData.name}</h5>`
        });

        const marker = new google.maps.Marker({
          position: markerData,
          map: map,
          title: markerData.name
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      });

      google.maps.event.addListenerOnce(map, 'idle', () => {
        mapEle.classList.add('show-map');
      });
    });
  }

  render() {
    return [
      <ion-header>
        <ion-toolbar color="primary">
          <ion-buttons slot="start">
            <ion-menu-button></ion-menu-button>
          </ion-buttons>
          <ion-title>Map</ion-title>
        </ion-toolbar>
      </ion-header>,

      <ion-content>
        <div class="map-canvas"></div>
      </ion-content>

    ];
  }
}
