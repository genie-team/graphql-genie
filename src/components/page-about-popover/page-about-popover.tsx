import '@ionic/core';
import '@stencil/core';

import { PopoverController } from '@ionic/core';

import { Component, Prop } from '@stencil/core';

@Component({
  tag: 'page-about-popover',
  styleUrl: 'page-about-popover.css',
})
export class PageAboutPopover {
  @Prop({ connect: 'ion-popover-controller' }) popoverCtrl: PopoverController;

  close(url: string) {
    window.open(url, '_blank');
    this.popoverCtrl.dismiss();
  }

  // TODO this should navigate to support as a root
  support() {
    console.log('navigate to support');
    this.popoverCtrl.dismiss();
  }

  render() {
    return [
      <ion-list>
        <ion-item onClick={() => this.close('http://ionicframework.com/docs/v2/getting-started')}>
          <ion-label>Learn Ionic</ion-label>
        </ion-item>
        <ion-item onClick={() => this.close('http://ionicframework.com/docs/v2')}>
          <ion-label>Documentation</ion-label>
        </ion-item>
        <ion-item onClick={() => this.close('http://showcase.ionicframework.com')}>
          <ion-label>Showcase</ion-label>
        </ion-item>
        <ion-item onClick={() => this.close('https://github.com/ionic-team/ionic')}>
          <ion-label>GitHub Repo</ion-label>
        </ion-item>
        <ion-item onClick={() => this.support()}>
          <ion-label>Support</ion-label>
        </ion-item>
      </ion-list>

    ];
  }
}
