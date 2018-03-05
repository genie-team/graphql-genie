const sass = require('@stencil/sass');

exports.config = {
  serviceWorker: {
    swSrc: 'src/service-worker.js'
  },
  globalStyle: 'src/global.scss',
  plugins: [
    sass()
  ]
};

exports.devServer = {
  root: 'www',
  watchGlob: '**/**'
};
