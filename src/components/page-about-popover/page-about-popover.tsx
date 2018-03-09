import '@ionic/core';
import '@stencil/core';

import { Component, Element, Prop } from '@stencil/core';
import { NavControllerBase } from '@ionic/core';

@Component({
  tag: 'page-about-popover',
  styleUrl: 'page-about-popover.css'
})
export class PageAboutPopover {
  @Element() el: HTMLElement;

  @Prop({ connect: 'ion-nav' })
  nav: NavControllerBase;

  close(url: string) {
    window.open(url, '_blank');
    this.dismiss();
  }

  async support() {
    const nav: NavControllerBase = await (this.nav as any).componentOnReady();
    nav.setRoot('page-support', null, { animate: true, direction: 'forward' });
    this.dismiss();
  }

  dismiss() {
    (this.el.closest('ion-popover') as any).dismiss();
  }

  render() {
    return [
      <ion-list>
        <ion-item onClick={() => this.close('http://ionicframework.com/docs/getting-started')} >
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
