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
    $scope.totalPubs = 77;
    $scope.numVisited = $scope.visited.length;
    $scope.pub = {
      "title": "Default Pub",
      "visited": false
    };

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
      labels = d3.select("#map").selectAll(".label");
      geoStations = d3.select("#map").selectAll(".geoStations");
      discrepencies = d3.select("#map").selectAll(".discrepencies");

      lines.on("mouseover", function() {
        map.highlightLine(d3.select(this).attr("id"))
      });

      lines.on("mouseout", function() {
        map.unhighlightLine()
      });

      labels.on("click", function() {
        var label = d3.select(this);

        var pubName = label.attr("id");

        $scope.pub = {
          "title": $scope.data.stations[pubName].title,
          "position": $scope.data.stations[pubName].position,
          "element": label,
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
  })
  .controller('SideNavCtrl', function ($scope, $mdSidenav) {
    $scope.addPub = function() {
      var label = $scope.pub.element;

      var pubName = label.attr("id");

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

    $scope.close = function () {
      $mdSidenav('left').close();
    };
  });
