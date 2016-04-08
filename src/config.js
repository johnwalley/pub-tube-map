export default function($mdThemingProvider, uiGmapGoogleMapApiProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('light-blue')
    .accentPalette('blue');

  uiGmapGoogleMapApiProvider.configure({
      key: 'AIzaSyCHEhDFuNZE1-Se3x7aRHZLCHwMV2Xqhnc',
      v: '3.22',
      libraries: 'places'
  });
};
