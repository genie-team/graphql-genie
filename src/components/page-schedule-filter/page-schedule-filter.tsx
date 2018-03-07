import '@ionic/core';
import '@stencil/core';

import { ModalController } from '@ionic/core';
import { Component, Prop, State } from '@stencil/core';

import { ConferenceData } from '../../providers/conference-data';


@Component({
  tag: 'page-schedule-filter',
  styleUrl: 'page-schedule-filter.css',
})
export class PageScheduleFilter {
  @State() tracks: Array<{name: string, isChecked: boolean}> = [];

  @Prop({ connect: 'ion-modal-controller' }) modalCtrl: ModalController;

  async componentWillLoad() {
    // passed in array of track names that should be excluded (unchecked)
    // TODO = this.navParams.data.excludedTracks;
    const excludedTrackNames = [];

    await ConferenceData.getTracks().then((trackNames: string[]) => {
      trackNames.forEach(trackName => {
        this.tracks.push({
          name: trackName,
          isChecked: (excludedTrackNames.indexOf(trackName) === -1)
        });
      });
    });
  }

  // TODO modal dismiss is broken
  dismiss(data?: any) {
    // dismiss this modal and pass back data
    this.modalCtrl.dismiss(data);
  }

  applyFilters() {
    // Pass back a new array of track names to exclude
    const excludedTrackNames = this.tracks.filter(c => !c.isChecked).map(c => c.name);
    this.dismiss(excludedTrackNames);
  }

  resetFilters() {
    // reset all of the toggles to be checked
    this.tracks.forEach(track => {
      track.isChecked = true;
    });
  }


  render() {
    return [
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button onClick={() => this.dismiss()}>Cancel</ion-button>
          </ion-buttons>

          <ion-title>
            Filter Sessions
          </ion-title>

          <ion-buttons slot="end">
            <ion-button onClick={() => this.applyFilters()} strong>Done</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>,

      <ion-content class="outer-content">
        <ion-list>
          <ion-list-header>Tracks</ion-list-header>

          {this.tracks.map(track =>
            <ion-item class={{[`item-track-${track.name.toLowerCase()}`]: true, "item-track": true}}>
              <span slot="start" class="dot"></span>
              <ion-label>{track.name}</ion-label>
              <ion-toggle checked={track.isChecked} color="success"></ion-toggle>
            </ion-item>
          )}
        </ion-list>

        <ion-list>
          <ion-item onClick={() => this.resetFilters()} detail-none class="reset-filters">
            Reset All Filters
          </ion-item>
        </ion-list>
      </ion-content>
    ];
  }
}
