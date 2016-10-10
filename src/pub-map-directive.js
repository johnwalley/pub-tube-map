import * as tubeMap from 'd3-tube-map';
import {select} from 'd3-selection';

export default function() {
  return {
    restrict: 'EA',
    scope: {
      data: '=',
      onClick: '&',
    },
    link: function($scope, element, attrs) {
      const svg = select(element[0])
        .append('svg')
        .style('width', '100%')
        .style('height', '100%');

      const width = 1600;
      const height = 1024;

      const map = tubeMap.tubeMap()
        .width(width)
        .height(height)
        .margin({
          top: height / 50,
          right: width / 7,
          bottom: height / 10,
          left: width / 7,
        });

      svg.datum($scope.data).call(map);

      map.on('click', (name) => {
        $scope.onClick({item: name});
        $scope.$apply();
      });

      $scope.$watch('data.selectedPub', function() {
        map.selectStation($scope.data.selectedPub);
      });

      $scope.$watch('data.centeredPub', function() {
        map.centerOnPub($scope.data.centeredPub);
        $scope.data.centeredPub = undefined;
      });

      $scope.$watchCollection('data.visited', function() {
        map.visitStations($scope.data.visited);
      });
    }
  }
}
