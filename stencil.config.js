exports.config = {
  serviceWorker: {
    swSrc: 'src/service-worker.js'
  },
  globalStyle: 'src/global.css'
};

exports.devServer = {
  root: 'www',
  watchGlob: '**/**'
};
