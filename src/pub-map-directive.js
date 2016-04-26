export default function() {
  return {
    restrict: 'EA',
    scope: {
      data: '=',
      onClick: '&',
    },
    link: function($scope, element, attrs) {
      const svg = d3.select(element[0])
        .append('svg')
        .style('width', '100%')
        .style('height', '100%');

      const width = 1600;
      const height = 1024;

      const map = tubeMap()
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

      $scope.$watchCollection('data.visited', function() {
        map.visitStations($scope.data.visited);
      });

      $scope.$watchCollection('data.centeredPub', function() {
        map.centerOnPub($scope.data.centeredPub);
      });
    }
  }
}
