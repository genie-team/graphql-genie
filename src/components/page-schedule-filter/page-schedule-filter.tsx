import '@ionic/core';
import '@stencil/core';

import { Config } from '@ionic/core';
import { Component, Element, Listen, Prop, State } from '@stencil/core';

import { ConferenceData } from '../../providers/conference-data';


@Component({
  tag: 'page-schedule-filter',
  styleUrl: 'page-schedule-filter.css',
})
export class PageScheduleFilter {
  @Element() el: any;

  @State() tracks: Array<{name: string, isChecked: boolean}>;

  @Prop({ context: 'config' }) config: Config;

  async componentWillLoad() {
    // passed in array of track names that should be excluded (unchecked)
    // TODO = this.navParams.data.excludedTracks;
    const excludedTrackNames = [];

    const trackNames = await ConferenceData.getTracks();
    this.tracks = trackNames.map(trackName => ({
      name: trackName,
      isChecked: (excludedTrackNames.indexOf(trackName) === -1)
    }));
  }

  dismiss(data?: any) {
    // dismiss this modal and pass back data
    (this.el.closest('ion-modal') as any).dismiss(data);
  }

  applyFilters() {
    // Pass back a new array of track names to exclude
    const excludedTrackNames = this.tracks.filter(c => !c.isChecked).map(c => c.name);
    this.dismiss(excludedTrackNames);
  }

  // reset all of the toggles to be checked
  resetFilters() {
    this.tracks.forEach(track => {
      track.isChecked = true;
    });
    this.el.forceUpdate();
  }

  @Listen('ionChange')
  onToggleChanged(ev: CustomEvent) {
    const track = this.tracks.find(({name}) => name === (ev.target as any).name);
    track.isChecked = (ev.target as any).checked;
  }

  render() {
    const mode = this.config.get('mode');

    return [
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot={mode === 'md' ? 'end' : 'start'}>
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
            <ion-item class={{[`item-track-${track.name.toLowerCase()}`]: true, 'item-track': true}}>
              <span slot="start" class="dot"></span>
              <ion-label>{track.name}</ion-label>
              <ion-toggle checked={track.isChecked} color="success" name={track.name}></ion-toggle>
            </ion-item>
          )}
        </ion-list>

        <ion-list>
          <ion-item onClick={() => this.resetFilters()} detail-none>
            <ion-label color="danger">
              Reset All Filters
            </ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    ];
  }
}
