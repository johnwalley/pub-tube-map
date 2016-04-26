export default class PubMapCtrl {
  constructor(
    $scope,
    $mdSidenav,
    $mdBottomSheet,
    $mdMedia,
    $mdToast,
    $location,
    $log,
    uiGmapGoogleMapApi,
    uiGmapIsReady,
    pubs,
    geolocation) {
    this.$scope = $scope;
    this.$mdSidenav = $mdSidenav;
    this.$mdBottomSheet = $mdBottomSheet;
    this.$mdMedia = $mdMedia;
    this.$mdToast = $mdToast;
    this.$location = $location;
    this.$log = $log;
    this.uiGmapGoogleMapApi = uiGmapGoogleMapApi;
    this.uiGmapIsReady = uiGmapIsReady;
    this.pubs = pubs;
    this.geolocation = geolocation;

    const width = 1600;
    const height = 1024;

    this.bottomsheetVisible = false;

    this.developerMode = false;
    this.pub = {
      title: 'Default Pub',
    };


    const _this = this;

    d3.json('pubs.json', function (data) {
      _this.data = data;
      _this.data.visited = [];
      _this.data.centeredPub = undefined;
      _this.numVisited = _this.data.visited.length;
      _this.totalPubs = Object.keys(data.stations).length;

      const path = _this.$location.path().replace(/^\//g, '');

      if (path.length) {
        _this.data.visited = path.split(',');
        _this.data.visited.map((pub) => {
          _this.data.stations[pub].visited = true;
        });
      } else {
        _this.data.visited = [];
      }

      _this.numVisited = _this.data.visited.length;
      _this.$scope.$apply(); // TODO: Fix these ugly hacks
    });
  }

  share() {
    // TODO: Can we make sure FB is initialized?
    FB.ui({
      method: 'share_open_graph',
      action_type: 'pub-map:share',
      action_properties: JSON.stringify({
        'result': {
          'pub-map:visited': 45,
          'pub-map:total': 78,
          'og:type': 'pub-map:result',
          'og:url': 'http://www.pubmap.co.uk/',
          'og:title': `I\'ve been to ${this.numVisited}/${this.totalPubs} pubs in Cambridge! How do you compare?`,
          'og:description': 'A map of Cambridge pubs',
          'og:image': 'http://www.pubmap.co.uk/img/facebook.png'
        }
      })
    }, function(response){
      // Debug response (optional)
      console.log(response);
    });
  }

  onClick(item) {
    this.selectPub(item);
  }

  toggleLeft() {
    this.buildToggler('left');
  }

  buildToggler(navID) {
    return () => {
      this.$mdSidenav(navID)
        .toggle();
    };
  }

  selectPub(pubName) {
    const station = this.data.stations[pubName];

    this.pub = {
      name: pubName,
      title: station.title,
      address: station.address,
      website: station.website,
      phone: station.phone,
      position: station.position,
      visited: station.visited,
      googleMap: {
        center: {
          latitude: station.position.lat,
          longitude: station.position.lon,
        },
        zoom: 16,
        marker: {
          id: 0,
          coords: {
            latitude: station.position.lat,
            longitude: station.position.lon,
          },
        },
      },
    };

    if (station.hasOwnProperty('place_id')) {
      this.uiGmapGoogleMapApi.then((maps) => {
        const request = {
          placeId: station.place_id,
        };

        const service = new maps.places.PlacesService(document.getElementById('html_attributions'));
        service.getDetails(request, (place, status) => {
          if (status === maps.places.PlacesServiceStatus.OK) {
            if (place.hasOwnProperty('opening_hours')) {
              const now = new Date(Date.now());
              const dayOfWeek = (now.getDay() + 6) % 7;

              const str = place.opening_hours.weekday_text[dayOfWeek]

              const hours = str.substring(str.indexOf(":") + 1);

              const openNow = place.opening_hours.open_now ? "Open now" : "Closed";

              this.pub.opening_hours = `${openNow}:${hours}`;
              this.$scope.$apply();
            }
          }
        });
      });
    }

    if (!this.pub.visited) {
      this.pub.clickIcon = 'add';
      this.pub.backgroundColor = 'rgb(0,152,212)'; // TODO: Change class and handle through css
    } else {
      this.pub.clickIcon = 'done';
      this.pub.backgroundColor = 'rgb(0, 222, 121)';
    }

    if (this.$mdMedia('gt-xs')) {
      this.toggleLeft();
    } else {
      this.showListBottomSheet();
    }

    this.data.selectedPub = pubName;

    ga('send', 'event', 'Station', 'click', pubName);
  }

  centerPub(name) {
    this.data.centeredPub = name;
  }

  selectNearestPub() {
    function error() {
      console.log("Unable to retrieve your location");
      this.$mdToast.show(
        this.$mdToast.simple()
          .textContent('Unable to retrieve your location')
          .position('top right')
          .hideDelay(3000)
      );
    }

    this.geolocation.getLocation().then((position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      let minDistance = 10000000;
      let nearestPub;

      nearestPub = this.pubs.findNearestPub(this.data.stations, latitude, longitude);

      this.centerPub(nearestPub);
      this.selectPub(nearestPub);

      // TODO: These lines need to go into the map
      d3.select("#map").selectAll(".label").classed("selected", false);
      d3.select("#map").select(".labels").select("#" + nearestPub).classed("selected", true);

      ga('send', 'event', 'Nearest', 'click', nearestPub);
    });
  }

  selectRandomPub() {
    const randomPubName = this.pubs.findRandomPub(this.data.stations);

    this.centerPub(randomPubName);
    this.selectPub(randomPubName);
    d3.select("#map").selectAll(".label").classed("selected", false);

    d3.select("#map").select(".labels").select("#" + randomPubName).classed("selected", true);
  }

  showListBottomSheet() {

    if (!this.bottomsheetVisible) {
      this.$mdBottomSheet.show({
        templateUrl: 'src/bottomSheetTemplate.html',
        controller: 'PubMapCtrl',
        scope: this.$scope, // Needs a real scope object to call methods like $watch
        disableParentScroll: false,
        disableBackdrop: true,
        clickOutsideToClose: false,
        preserveScope: true, // TODO: Surely this is a hack
      }).then(() => { this.bottomsheetVisible = false; }, () => { this.bottomsheetVisible = false; }); // resolved on hide() and rejected on cancel()
    }

    this.bottomsheetVisible = true;
  }

  togglePub() {
    const name = this.pub.name;

    const index = this.data.visited.indexOf(name);

    if (index === -1) {
      this.addPub();
    } else {
      this.removePub();
    }

    this.$location.path(this.data.visited);
  }

  addPub() {
    const name = this.pub.name;

    if (this.data.visited.indexOf(name) === -1) {
      this.data.stations[name].visited = true;
      this.data.visited.push(name);
      this.pub.visited = true;
      this.pub.clickIcon = 'done';
      this.pub.backgroundColor = 'rgb(0, 222, 121)';
    }

    this.numVisited = this.data.visited.length;

    this.$mdToast.show(
      this.$mdToast.simple()
        .textContent('Progress saved')
        .position('top')
        .hideDelay(1000));

    ga('send', 'event', 'Station', 'addPub', name);
  }

  removePub() {
    const name = this.pub.name;
    const label = d3.select("#" + name);
    const index = this.data.visited.indexOf(name);

    if (index > -1) {
      this.data.stations[name].visited = false;
      this.data.visited.splice(index, 1);
      this.pub.visited = false;
      this.pub.clickIcon = 'add';
      this.pub.backgroundColor = 'rgb(0,152,212)';

      // TODO: Make data driven
      //this.map.removeStation(name);
    }

    this.numVisited = this.data.visited.length;

    ga('send', 'event', 'Station', 'removePub', name);
  }

  displayDirections() {
    let directionsDisplay;
    let directionsService;

    ga('send', 'event', 'GoogleMaps', 'directions', name);

    this.uiGmapGoogleMapApi.then((maps) => {
      directionsService = new maps.DirectionsService();
      directionsDisplay = new maps.DirectionsRenderer();

      return this.uiGmapIsReady.promise(1);
    })
    .then((instances) => {
      directionsDisplay.setMap(instances[0].map);

      // TODO: Remove nested promises
      this.geolocation.getLocation().then((position) => {
        const start = `${position.coords.latitude},${position.coords.longitude}`;
        const end = this.pub.address;
        const request = {
          origin: start,
          destination: end,
          travelMode: google.maps.TravelMode.WALKING
        };

        directionsService.route(request, function(result, status) {
          if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(result);
          }
        });
      });
    });
  }

  getMatches(query) {
    let stations = this.data.stations;

    let pubs = [];

    for (let pub in stations) {
      if (stations.hasOwnProperty(pub)) {
        let searchPub = {
          value: pub,
          display: stations[pub].title,
          address: stations[pub].address
        }

        pubs.push(searchPub);
      }
    }

    let lowercaseQuery = angular.lowercase(query);

    return pubs.filter((pub) => angular.lowercase(pub.display).indexOf(lowercaseQuery) !== -1);
  }

  selectedItemChange(item) {
    if (typeof item !== 'undefined') {
      this.selectPub(item.value);
      this.centerPub(item.value);

      // TODO: These lines need to go into the map
      d3.select("#map").selectAll(".label").classed("selected", false);
      d3.select("#map").select(".labels").select("#" + item.value).classed("selected", true);
    }
  }
}
