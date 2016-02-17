angular
  .module('pubMapApp', ['ngMaterial'])
  .controller('PubMapCtrl', function ($scope, $mdSidenav) {
    var width = 1600,
        height = 1024;

    var map = tubeMap()
      .width(width)
      .height(height)
      .margin({
        top: height / 10,
        right: width / 7,
        bottom: height / 10,
        left: width / 7
      });

    $scope.visited = [];
    $scope.developerMode = false;
    $scope.totalPubs;
    $scope.numVisited = $scope.visited.length;

    var lines;
    var stations;
    var labels;
    var geoStations;
    var discrepencies;

    d3.json("pubs.json", function(data) {
      d3.select("#map").datum(data)
        .call(map);

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
          "title": data.stations[pubName].title,
          "position": data.stations[pubName].position,
          "element": label
        };

        $scope.toggleLeft();

        ga('send', 'event', 'Station', 'click');
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

      if (label.classed("highlighted")) {
        var index = $scope.visited.indexOf(label.attr("id"));
        if (index > -1) {
          $scope.visited.splice(index, 1);
          label.classed("highlighted", false);
        }
      } else {
        $scope.visited.push(label.attr("id"));
        label.classed("highlighted", true);
      }

      $scope.$parent.numVisited = $scope.visited.length;
    };

    $scope.close = function () {
      $mdSidenav('left').close();
    };
  });