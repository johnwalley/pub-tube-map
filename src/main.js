import angular from 'angular';
import ngMaterial from 'angular-material';
import ngMdIcons from 'angular-material-icons';

import 'angular-google-maps';
import 'angularjs-geolocation';

import 'angular-material-bottom-sheet-collapsible';

import 'lodash';
import 'angular-simple-logger';
import 'angular-svg-round-progressbar';

import 'd3';

import PubMapCtrl from './pub-map-controller';
import PubMapDirective from './pub-map-directive.js';
import minimizeUrl from './minimize-url.js';
import config from './config.js';
import pubs from './pubs.js'

require('../node_modules/angular-material/angular-material.min.css');
require('../node_modules/angular-material-bottom-sheet-collapsible/bottomSheetCollapsible.css');
require('../tube-map.css');

angular.module('pubMapApp', [ngMaterial, ngMdIcons, 'uiGmapgoogle-maps', 'geolocation', 'angular-svg-round-progressbar', 'material.components.bottomSheetCollapsible'])
.config(config)
.controller('PubMapCtrl', PubMapCtrl)
.directive('pubMap', PubMapDirective)
.service('pubs', pubs)
.filter('minimizeUrl', minimizeUrl);
