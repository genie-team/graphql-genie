import '@ionic/core';
import '@stencil/core';

import { Component, Element } from '@stencil/core';
import { ConferenceData } from '../../providers/conference-data';

declare var google: any;

@Component({
  tag: 'page-map',
  styleUrl: 'page-map.css',
})
export class PageMap {
  private mapData: any;

  @Element() private el: HTMLElement;

  async componentWillLoad() {
    await getGoogleMaps('AIzaSyB8pf6ZdFQj5qw7rc_HSGrhUwQKfIe9ICw');
    this.mapData = await ConferenceData.getMap();
  }

  async componentDidLoad() {
    const mapData = this.mapData;
    const mapEle = this.el.querySelector('.map-canvas');

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

      <div class="map-canvas"></div>
    ];
  }
}

function getGoogleMaps(apiKey: string): Promise<any> {
  const win = window as any;
  const google = win.google;
  if (google && google.maps) {
    return Promise.resolve(google.maps);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=3.31`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    script.onload = () => {
      const win = window as any;
      const google = win.google;
      if (google && google.maps) {
        resolve(google.maps);
      } else {
        reject('google maps not available');
      }
    };
  });
}
