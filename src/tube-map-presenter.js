function presenter(m, v, s) {
  var model = m;
  var view = v;
  var score = s;

  var numVisited = 0;

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

  view.datum(model.data)
    .call(map);

  var lines = d3.select("#map").selectAll(".line");
  var stations = d3.select("#map").selectAll(".station");
  var labels = d3.select("#map").selectAll(".label");
  var button = d3.select("#debug");

  button.on("click", function() {
    map.toggleDeveloperMode();
  });

  function p() {
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
        var index = model.visited.indexOf(label.attr("id"));
        if (index > -1) {
          model.visited.splice(index, 1);
          label.classed("highlighted", false);
        }
      } else {
        model.visited.push(label.attr("id"));
        label.classed("highlighted", true);
      }

      score.text(model.visited.length);
    });


  }

  return p;
}
