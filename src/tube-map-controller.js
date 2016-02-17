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

    d3.json("pubs.json", function(data) {
      d3.select("#map").datum(data)
        .call(map);

      var lines = d3.select("#map").selectAll(".line");
      var stations = d3.select("#map").selectAll(".station");
      var labels = d3.select("#map").selectAll(".label");

      lines.on("mouseover", function() {
        map.highlightLine(d3.select(this).attr("id"))
      });

      lines.on("mouseout", function() {
        map.unhighlightLine()
      });

      labels.on("click", function() {
        var label = d3.select(this);

        $scope.pub = { "title": label.attr("id") };

        $scope.toggleLeft();

        ga('send', 'event', 'Station', 'click');

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

        $scope.numVisited = $scope.visited.length;
      });
    });

    $scope.toggleLeft = buildToggler('left');

    function buildToggler(navID) {
      return function() {
        $mdSidenav(navID)
          .toggle();
      }
    }
  })
  .controller('SideNavCtrl', function ($scope, $mdSidenav) {
    $scope.close = function () {
      $mdSidenav('left').close();
    };
  });
/*
angular.module('pubMapApp', [])
  .controller('PubMapController', function() {
    var pubMap = this;

    return;

    pubMap.visited = [];

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

    d3.json("pubs.json", function(data) {
      d3.select("#map").datum(data)
        .call(map);

      var lines = d3.select("#map").selectAll(".line");
      var stations = d3.select("#map").selectAll(".station");
      var labels = d3.select("#map").selectAll(".label");

      lines.on("mouseover", function() {
        map.highlightLine(d3.select(this).attr("id"))
      });

      lines.on("mouseout", function() {
        map.unhighlightLine()
      });

      labels.on("click", function() {
        var label = d3.select(this);

        ga('send', 'event', 'Station', 'click');

        if (label.classed("highlighted")) {
          var index = pubMap.visited.indexOf(label.attr("id"));
          if (index > -1) {
            pubMap.visited.splice(index, 1);
            label.classed("highlighted", false);
          }
        } else {
          pubMap.visited.push(label.attr("id"));
          label.classed("highlighted", true);
        }

        pubMap.numVisited = pubMap.visited.length;
      });
    });
  });
  */
