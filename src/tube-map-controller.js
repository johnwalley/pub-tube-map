angular
  .module('pubMapApp', ['ngMaterial', 'ngMdIcons'])
  .config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('light-blue')
    .accentPalette('blue');
  })
  .controller('PubMapCtrl', function ($scope, $mdSidenav) {
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
    $scope.totalPubs = 81;
    $scope.numVisited = $scope.visited.length;
    $scope.pub = {
      "title": "Default Pub",
      "visited": false
    };

    $scope.map = map;

    var lines;
    var stations;
    var labels;
    var geoStations;
    var discrepencies;

    d3.json("pubs.json", function(data) {
      d3.select("#map").datum(data)
        .call(map);

      $scope.data = data;

      $scope.totalPubs = Object.keys(data.stations).length;

      lines = d3.select("#map").selectAll(".line");
      stations = d3.select("#map").selectAll(".station");
      interchanges = d3.select("#map").selectAll(".interchange");
      labels = d3.select("#map").selectAll(".label");
      geoStations = d3.select("#map").selectAll(".geoStations");
      discrepencies = d3.select("#map").selectAll(".discrepencies");

      interchanges.on("click", function() {
        var label = d3.select(this);
        $scope.selectPub(label);
      });

      labels.on("click", function() {
        var label = d3.select(this);
        $scope.selectPub(label);
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

    $scope.selectPub = function(label) {
      var pubName = label.attr("id");
      $scope.selectPubByName(pubName);
      d3.select("#map").selectAll(".label").classed("bounce", false);

      label.classed("bounce", true);
    }

    $scope.selectPubByName = function(pubName) {
      $scope.pub = {
        "name": pubName,
        "title": $scope.data.stations[pubName].title,
        "address": $scope.data.stations[pubName].address,
        "website": $scope.data.stations[pubName].website,
        "phone": $scope.data.stations[pubName].phone,
        "position": $scope.data.stations[pubName].position,
        "visited": $scope.data.stations[pubName].visited
      };

      if (!$scope.pub.visited) {
        $scope.pub.clickIcon = 'add';
        $scope.pub.backgroundColor = '#0098d4';
      } else {
        $scope.pub.clickIcon = 'done';
        $scope.pub.backgroundColor = 'rgb(0, 222, 121)';
      }

      $scope.toggleLeft();

      ga('send', 'event', 'Station', 'click', pubName);
    }
  })
  .controller('SideNavCtrl', function ($scope, $mdSidenav) {
    $scope.addPub = function() {
      var pubName = $scope.pub.name;

      var label = d3.select("#" + pubName);

      if ($scope.visited.indexOf(pubName) == -1) {
        $scope.data.stations[pubName].visited = true;
        $scope.visited.push(pubName);
        $scope.pub.visited = true;
        label.classed("highlighted", true);
        $scope.pub.clickIcon = 'done';
        $scope.pub.backgroundColor = 'rgb(0, 222, 121)';
      }

      $scope.$parent.numVisited = $scope.visited.length;

      ga('send', 'event', 'Station', 'addPub', pubName);
    };

    $scope.removePub = function() {
      var pubName = $scope.pub.name;

      var label = d3.select("#" + pubName);

      var index = $scope.visited.indexOf(pubName);

      if (index > -1) {
        $scope.data.stations[pubName].visited = false;
        $scope.visited.splice(index, 1);
        $scope.pub.visited = false;
        label.classed("highlighted", false);
        $scope.pub.clickIcon = 'add';
        $scope.pub.backgroundColor = '#0098d4';
      }

      $scope.$parent.numVisited = $scope.visited.length;

      ga('send', 'event', 'Station', 'removePub', pubName);
    };

    function fetch_random(obj) {
      var temp_key, keys = [];
      for(temp_key in obj) {
         if(obj.hasOwnProperty(temp_key)) {
             keys.push(temp_key);
         }
      }
      return keys[Math.floor(Math.random() * keys.length)];
    }

    $scope.centerPub = function(name) {
      $scope.map.centerOnPub(name);
    };

    $scope.selectNearestPub = function() {
      var randomPubName = fetch_random($scope.data.stations);
      $scope.centerPub(randomPubName);
      $scope.$parent.selectPubByName(randomPubName)
    };


    $scope.close = function () {
      $mdSidenav('left').close();
    };
  })
  .directive('errSrc', function() {
    return {
      link: function(scope, element, attrs) {
        element.bind('error', function() {
          if (attrs.src != attrs.errSrc) {
            attrs.$set('src', attrs.errSrc);
          }
        });
      }
    }
  });
