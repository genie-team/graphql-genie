import '@ionic/core';
import '@stencil/core';

import { Component, Element } from '@stencil/core';

@Component({
  tag: 'page-about-popover',
  styleUrl: 'page-about-popover.css',
})
export class PageAboutPopover {
  @Element() el: HTMLElement;

  close(url: string) {
    window.open(url, '_blank');
    this.dismiss();
  }

  // TODO this should navigate to support as a root
  // need to discuss this with the team
  support() {
    console.log('navigate to support');
    this.dismiss();
  }

  dismiss() {
    (this.el.closest('ion-popover') as any).dismiss();
  }

  render() {
    return [
      <ion-list>
        <ion-item onClick={() => this.close('http://ionicframework.com/docs/getting-started')}>
          <ion-label>Learn Ionic</ion-label>
        </ion-item>
        <ion-item onClick={() => this.close('http://ionicframework.com/docs/')}>
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
        <ion-item onClick={() => this.dismiss()}>
          <ion-label>Dismiss</ion-label>
        </ion-item>
      </ion-list>

    ];
  }
}
