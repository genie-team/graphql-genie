import '@ionic/core';
import '@stencil/core';

import { Component } from '@stencil/core';

@Component({
  tag: 'page-about',
  styleUrl: 'page-about.css',
})
export class PageAbout {

  render() {
    return [
      <div>About Page</div>
    ];
  }
}
