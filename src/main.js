import angular from 'angular';
import ngMaterial from 'angular-material';
import ngMdIcons from 'angular-material-icons';

import 'angular-google-maps';
import 'angularjs-geolocation';

import 'lodash';
import 'angular-simple-logger';

import PubMapCtrl from './pub-map-controller';
import minimizeUrl from './minimize-url.js';
import config from './config.js';
import pubs from './pubs.js'

angular.module('pubMapApp', [ngMaterial, ngMdIcons, 'uiGmapgoogle-maps', 'geolocation'])
.config(config)
.controller('PubMapCtrl', PubMapCtrl)
.service('pubs', pubs)
.filter('minimizeUrl', minimizeUrl);
