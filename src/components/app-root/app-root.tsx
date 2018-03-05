import '@ionic/core';
import '@stencil/core';

import { Component } from '@stencil/core';

@Component({
  tag: 'app-root',
  styleUrl: 'app-root.scss'
})
export class AppRoot {

  render() {
    return (
      <ion-app>
        <ion-split-pane>

          <ion-menu>
          </ion-menu>

          <ion-nav swipeBackEnabled={false} main></ion-nav>
        </ion-split-pane>
      </ion-app>
    );
  }
}
