export default class PubMapCtrl {
  constructor(
    $scope,
    $mdSidenav,
    $mdBottomSheet,
    $mdMedia,
    $mdToast,
    $location,
    uiGmapGoogleMapApi) {

    this.$scope = $scope;
    this.$mdSidenav = $mdSidenav;
    this.$mdBottomSheet = $mdBottomSheet;
    this.$mdMedia = $mdMedia;
    this.$mdToast = $mdToast;
    this.$location = $location;
    this.uiGmapGoogleMapApi = uiGmapGoogleMapApi;

    const width = 1600;
    const height = 1024;

    this.visited = [];

    this.developerMode = false;
    this.numVisited = this.visited.length;
    this.pub = {
      "title": "Default Pub"
    };

    const map = tubeMap()
      .width(width)
      .height(height)
      .margin({
        top: height / 50,
        right: width / 7,
        bottom: height / 10,
        left: width / 7
      });

    this.map = map;

    this.totalPubs;

    let geoStations;
    let discrepencies;

    const _this = this;

    d3.json("pubs.json", function(data) {
      d3.select("#map").datum(data)
        .call(map);

      _this.data = data;

      _this.totalPubs = Object.keys(data.stations).length;

      geoStations = d3.select("#map").selectAll(".geoStations");
      discrepencies = d3.select("#map").selectAll(".discrepencies");

      let path = _this.$location.path().replace(/^\//g, '');

      if (path.length) {
        _this.visited = path.split(',');
        _this.visited.map(function(pub) {
          _this.map.addStation(pub);
          _this.data.stations[pub].visited = true;
        });
      } else {
        _this.visited = [];
      }

      _this.map.on('click', function(name) {
        _this.selectPub(name);
        _this.$scope.$apply();
      });
    });
  }

  developerModeToggle() {
    if (this.developerMode) {
      geoStations.style("display", "block");
      discrepencies.style("display", "block");
    } else {
      geoStations.style("display", "none");
      discrepencies.style("display", "none");
    }
  }

  toggleLeft() {
     this.buildToggler('left');
  }

  buildToggler(navID) {
     return () => {
       $mdSidenav(navID)
         .toggle();
     }
   }

  selectPub (name) {
    let station = this.data.stations[name];

    this.pub = {
      "name": name,
      "title": station.title,
      "address": station.address,
      "website": station.website,
      "phone": station.phone,
      "position": station.position,
      "visited": station.visited,
      "googleMap": {
        "center": {
          "latitude": station.position.lat,
          "longitude": station.position.lon
        },
        "zoom": 16,
        "marker": {
          "id": 0,
          "coords": {
            "latitude": station.position.lat,
            "longitude": station.position.lon
          }
        }
      }
    }

    const _this = this;

    if (station.hasOwnProperty('place_id')) {
      this.uiGmapGoogleMapApi.then(function(maps) {
        const request = {
          placeId: station.place_id
        };

        const service = new maps.places.PlacesService(document.getElementById('html_attributions'));
        service.getDetails(request, function(place, status) {
          if (status == google.maps.places.PlacesServiceStatus.OK) {
            if (place.hasOwnProperty('opening_hours')) {
              const now = new Date(Date.now());
              const dayOfWeek = (now.getDay() - 1) % 7;
              _this.pub['opening_hours'] = place.opening_hours.weekday_text[dayOfWeek];
              _this.$scope.$apply();
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

    ga('send', 'event', 'Station', 'click', name);
  }

  centerPub(name) {
    this.map.centerOnPub(name);
  }

  selectNearestPub() {
    const _this = this;

    function success(position) {
      const latitude  = position.coords.latitude;
      const longitude = position.coords.longitude;

      let minDistance = 10000000;
      let nearestPub;

      const stations = _this.data.stations;

      for (let key in stations) {
        if (!stations.hasOwnProperty(key)) continue;

        const distance = Math.pow(stations[key].position.lat - latitude, 2) + Math.pow(stations[key].position.lon - longitude, 2);

        if (distance < minDistance) {
          minDistance = distance;
          nearestPub = key;
        }
      }

      _this.centerPub(nearestPub);
      _this.selectPub(nearestPub);

      d3.select("#map").selectAll(".label").classed("selected", false); // TODO: These lines need to go into the map
      d3.select("#map").select(".labels").select("#" + nearestPub).classed("selected", true);

      ga('send', 'event', 'Nearest', 'click', nearestPub);
    }

    function error() {
      console.log("Unable to retrieve your location");
      $mdToast.show(
        $mdToast.simple()
          .textContent('Unable to retrieve your location')
          .position('top right')
          .hideDelay(3000)
      );
    }

    navigator.geolocation.getCurrentPosition(success, error);
  }

  selectRandomPub() {
    const randomPubName = fetch_random(this.data.stations);

    this.centerPub(randomPubName);
    this.selectPub(randomPubName);
    d3.select("#map").selectAll(".label").classed("selected", false);

    d3.select("#map").select(".labels").select("#" + randomPubName).classed("selected", true);
  }

  fetch_random(obj) {
    let temp_key, keys = [];
    for (temp_key in obj) {
      if (obj.hasOwnProperty(temp_key)) {
        keys.push(temp_key);
      }
    }
    return keys[Math.floor(Math.random() * keys.length)];
  }

  showListBottomSheet() {
    this.$mdBottomSheet.show({
      templateUrl: 'src/bottomSheetTemplate.html',
      controller: 'PubMapCtrl',
      scope: this.$scope, // Needs a real scope object to call methods like $watch
      disableParentScroll: false,
      preserveScope: true // TODO: Surely this is a hack
    });
  }

  togglePub() {
    const name = this.pub.name;

    const index = this.visited.indexOf(name);

    if (index == -1) {
      this.addPub();
    } else {
      this.removePub();
    }

    this.$location.path(this.visited);
  }

  addPub() {
    let name = this.pub.name;
    let label = d3.select("#" + name);

    if (this.visited.indexOf(name) == -1) {
      this.data.stations[name].visited = true;
      this.visited.push(name);
      this.pub.visited = true;
      this.pub.clickIcon = 'done';
      this.pub.backgroundColor = 'rgb(0, 222, 121)';

      this.map.addStation(name);
    }

    this.numVisited = this.visited.length;

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
    const index = this.visited.indexOf(name);

    if (index > -1) {
      this.data.stations[name].visited = false;
      this.visited.splice(index, 1);
      this.pub.visited = false;
      this.pub.clickIcon = 'add';
      this.pub.backgroundColor = 'rgb(0,152,212)';

      this.map.removeStation(name);
    }

    this.numVisited = this.visited.length;

    ga('send', 'event', 'Station', 'removePub', name);
  }

  close() {
    $mdSidenav('left').close();
  }
}
