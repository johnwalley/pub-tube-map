angular
  .module('pubMapApp', ['ngMaterial', 'ngMdIcons', 'uiGmapgoogle-maps'])
  .config(function($mdThemingProvider, uiGmapGoogleMapApiProvider) {
    $mdThemingProvider.theme('default')
      .primaryPalette('light-blue')
      .accentPalette('blue');

      uiGmapGoogleMapApiProvider.configure({
          key: 'AIzaSyCHEhDFuNZE1-Se3x7aRHZLCHwMV2Xqhnc',
          v: '3.22',
          libraries: 'places'
      });
  })
  .controller('PubMapCtrl', function($scope, $mdSidenav, $mdBottomSheet, $mdMedia, $mdToast) {
    var width = 1600,
      height = 1024;

    var map = tubeMap()
      .width(width)
      .height(height)
      .margin({
        top: height / 50,
        right: width / 7,
        bottom: height / 10,
        left: width / 7
      });

    $scope.visited = [];
    $scope.developerMode = false;
    $scope.numVisited = $scope.visited.length;
    $scope.pub = {
      "title": "Default Pub"
    };

    $scope.map = map;

    $scope.totalPubs;

    var geoStations;
    var discrepencies;

    d3.json("pubs.json", function(data) {
      d3.select("#map").datum(data)
        .call(map);

      $scope.data = data;

      $scope.totalPubs = Object.keys(data.stations).length;

      geoStations = d3.select("#map").selectAll(".geoStations");
      discrepencies = d3.select("#map").selectAll(".discrepencies");

      map.on('click', function(name) {
        $scope.selectPub(name);
      });
    });

    $scope.developerModeToggle = function() {
      if ($scope.developerMode) {
        geoStations.style("display", "block");
        discrepencies.style("display", "block");
      } else {
        geoStations.style("display", "none");
        discrepencies.style("display", "none");
      }
    };

    $scope.toggleLeft = buildToggler('left');

    function buildToggler(navID) {
      return function() {
        $mdSidenav(navID)
          .toggle();
      }
    }

    $scope.selectPub = function(name) {
      var station = $scope.data.stations[name];

      $scope.pub = {
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
      };

      if (!$scope.pub.visited) {
        $scope.pub.clickIcon = 'add';
        $scope.pub.backgroundColor = 'rgb(0,152,212)'; // TODO: Change class and handle through css
      } else {
        $scope.pub.clickIcon = 'done';
        $scope.pub.backgroundColor = 'rgb(0, 222, 121)';
      }

      if ($mdMedia('gt-xs')) {
        $scope.toggleLeft();
      } else {
        $scope.showListBottomSheet();
      }

      ga('send', 'event', 'Station', 'click', name);
    }

    $scope.centerPub = function(name) {
      $scope.map.centerOnPub(name);
    };

    $scope.selectNearestPub = function() {
      function success(position) {
        var latitude  = position.coords.latitude;
        var longitude = position.coords.longitude;

        var minDistance = 10000000;
        var nearestPub;

        var stations = $scope.data.stations;

        for (var key in stations) {
          if (!stations.hasOwnProperty(key)) continue;

          var distance = Math.pow(stations[key].position.lat - latitude, 2) + Math.pow(stations[key].position.lon - longitude, 2);

          if (distance < minDistance) {
            minDistance = distance;
            nearestPub = key;
          }
        }

        $scope.centerPub(nearestPub);
        $scope.selectPub(nearestPub);

        d3.select("#map").selectAll(".label").classed("bounce", false); // TODO: These lines need to go into the map
        d3.select("#map").select(".labels").select("#" + nearestPub).classed("bounce", true);

        ga('send', 'event', 'Nearest', 'click', nearestPub);
      };

      function error() {
        console.log("Unable to retrieve your location");
        $mdToast.show(
          $mdToast.simple()
            .textContent('Unable to retrieve your location')
            .position('top right')
            .hideDelay(3000)
        );
      };
      navigator.geolocation.getCurrentPosition(success, error);
    }

    $scope.selectRandomPub = function() {
      var randomPubName = fetch_random($scope.data.stations);
      $scope.centerPub(randomPubName);
      $scope.selectPub(randomPubName);
      d3.select("#map").selectAll(".label").classed("bounce", false);

      d3.select("#map").select(".labels").select("#" + randomPubName).classed("bounce", true);
    }

    function fetch_random(obj) {
      var temp_key, keys = [];
      for (temp_key in obj) {
        if (obj.hasOwnProperty(temp_key)) {
          keys.push(temp_key);
        }
      }
      return keys[Math.floor(Math.random() * keys.length)];
    }

    $scope.showListBottomSheet = function() {
      $scope.alert = '';
      $mdBottomSheet.show({
        templateUrl: 'src/bottomSheetTemplate.html',
        controller: 'SideNavCtrl',
        scope: $scope,
        preserveScope: true // TODO: Surely this is a hack
      });
    };
  })
  .controller('SideNavCtrl', function($scope, $mdSidenav, $mdBottomSheet, $mdToast) {
    $scope.togglePub = function() {
      var name = $scope.pub.name;

      var index = $scope.visited.indexOf(name);

      if (index == -1) {
        $scope.addPub();
      } else {
        $scope.removePub();
      }
    }

    $scope.addPub = function() {
      var name = $scope.pub.name;

      var label = d3.select("#" + name);

      if ($scope.visited.indexOf(name) == -1) {
        $scope.data.stations[name].visited = true;
        $scope.visited.push(name);
        $scope.pub.visited = true;
        $scope.pub.clickIcon = 'done';
        $scope.pub.backgroundColor = 'rgb(0, 222, 121)';

        $scope.map.addStation(name);
      }

      $scope.$parent.numVisited = $scope.visited.length;

      $mdToast.show(
        $mdToast.simple()
          .textContent('Progress saved')
          .position('top left')
          .hideDelay(1000));

      ga('send', 'event', 'Station', 'addPub', name);
    };

    $scope.removePub = function() {
      var name = $scope.pub.name;

      var label = d3.select("#" + name);

      var index = $scope.visited.indexOf(name);

      if (index > -1) {
        $scope.data.stations[name].visited = false;
        $scope.visited.splice(index, 1);
        $scope.pub.visited = false;
        $scope.pub.clickIcon = 'add';
        $scope.pub.backgroundColor = 'rgb(0,152,212)';

        $scope.map.removeStation(name);
      }

      $scope.$parent.numVisited = $scope.visited.length;

      ga('send', 'event', 'Station', 'removePub', name);
    };

    $scope.close = function() {
      $mdSidenav('left').close();
    }
  })
  .filter('minimizeUrl', function() {
    return function(input) {
      input = input || '';

      if (input.match(/http:\/\//)) {
        input = input.substring(7);
      }

      // TODO: Learn to write regular expressions
      if (input.match(/https:\/\//)) {
        input = input.substring(8);
      }

      if (input.match(/^www\./)) {
        input = input.substring(4);
      }

      if(input.substr(-1) === '/') {
          input = input.substr(0, input.length - 1);
      }

      return input;
    };
  });
