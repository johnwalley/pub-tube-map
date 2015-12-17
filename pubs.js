//Parse.initialize("viYcdJsQzu51MuROsQnEToQYhyK5CkQa7lmcUmQV", "NpR8DaCfiMwXgP7OtfUkKrduhexjD74oMmVmrZXj");

var options = {};

d3.json("pubs.json", function(data) {
  options.rows = data.rows;
  options.columns = data.columns;
  options.lineWidth = data.lineWidth;
  options.scale = data.cellSize;

  var scale = data.cellSize;
  var grid = data.grid;
  var gridNumbers = data.gridNumbers;
  var reverseMarkers = data.reverseMarkers;

  var visitedPubs = d3.set();

  var w = options.columns * scale;
  var h = options.rows * scale;

  var svg = d3.select("#map")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

  var lines = svg.append("g");

  drawLines(lines, data);

  var pubs = extractPubs(data);

  var lines = [];

  data.lines.forEach(function(line) {

    var lineObj = {
      "name": line.label,
      "pubs": [],
      "color": line.color
    };

    lines[lines.length] = lineObj;

    for (node = 0; node < line.nodes.length; node++) {
      var data = line.nodes[node];

      if (!data.hasOwnProperty("name"))
      continue;

      lineObj.pubs[lineObj.pubs.length] = data.name;
    }
  });

  var fgColor = "#000000";
  var bgColor = "#ffffff";

  var togglePub = function(pub) {
    return function() {
      if (visitedPubs.has(pub.name)) {
        visitedPubs.remove(pub.name);
        pub.visited = false;
      } else {
        visitedPubs.add(pub.name);
        pub.visited = true;
      }

      update();
    }
  };

  var textPos = function(data) {
    var pos;
    var textAnchor;
    var offset = options.lineWidth * 2;

    var numLines = data.name.split(/\n/).length;

    switch (data.labelPos.toLowerCase()) {
      case "n":
      pos = [0, -offset * numLines];
      textAnchor = "middle";
      break;
      case "e":
      pos = [offset, 0];
      textAnchor = "start";
      break;
      case "s":
      pos = [0, offset];
      textAnchor = "middle";
      break;
      case "sw":
      pos = [-offset*0.7, offset*0.8];
      textAnchor = "end";
      break;
      case "w":
      pos = [-offset, 0];
      textAnchor = "end";
      break;
      default:
      pos = [0, 0];
      break;
    }

    return {
      "pos": pos,
      "textAnchor": textAnchor
    }
  };

  var interchangeMarkers = svg.append("g");
  var markers = svg.append("g");

  var markerFunction = d3.svg.arc()
      .innerRadius(0)
      .outerRadius(options.lineWidth/2)
      .startAngle(0)
      .endAngle(2*Math.PI);

  var drawMarkers = function() {

    var interchangePubs = pubs.filter(function(d) { return d.marker === "interchange" && d.hide != true; });

    interchangeMarkers.selectAll("path")
      .data(interchangePubs)
      .attr("fill", function(d) { return d.visited ? fgColor : bgColor; })
      .attr("stroke", function(d) { return d.visited ? bgColor : fgColor; })
      .enter()
      .append("path")
      .attr("d", markerFunction())
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" })
      .attr("fill", bgColor)
      .attr("stroke", fgColor)
      .attr("stroke-width", options.lineWidth/4)
      .on("click", function(d) { togglePub(d)(); });

    var stationPubs = pubs.filter(function(d) { return d.marker === "station"; });

    var length = options.lineWidth/scale;

    markers.selectAll("path")
    .data(stationPubs)
    .enter()
    .append("path")
    .attr("d", function(d) {

      var dir;

      switch (d.labelPos.toLowerCase()) {
        case "n":
        dir = [0, -1];
        break;
        case "e":
        dir = [1, 0];
        break;
        case "s":
        dir = [0, 1];
        break;
        case "w":
        dir = [-1, 0];
        break;
        default:
        dir = [0, 0];
        break;
      }

      return lineFunction()([[d.x/scale, d.y/scale], [d.x/scale + length*dir[0], d.y/scale + length*dir[1]]]);
    })
    .attr("stroke", function(d) { return d.color; })
    .attr("stroke-width", options.lineWidth/2)
    .attr("fill", "none")
    .on("click", function(d) { return togglePub(d)(); });
  }

  var labels = svg.append("g");

  var drawLabels = function() {

    labels.selectAll("text")
    .data(pubs)
    .attr("font-weight", function(d) { return (d.visited ? "bold" : "normal"); })
    .enter()
    .append("text")
    .text(function(d) { return d.name })
    .style("display", function(d) { return d.hide != true ? "block" : "none"; })
    .attr("x", function(d) { return d.x + textPos(d).pos[0]; })
    .attr("y", function(d) { return d.y + textPos(d).pos[1] + 4; })
    .attr("dy", .1)
    .attr("font-family", "sans-serif")
    .attr("text-anchor", function(d) { return textPos(d).textAnchor })
    .on("click", function(d) { return togglePub(d)(); });
  }

  var awardIcons = d3.select("#awards");

  var drawAwards = function() {
    var awards = score(visitedPubs.values(), lines);

    var selectedIcons = awardIcons.selectAll("li").data(awards.filter(function(award) { return award.unlocked === true; }), function(d) { return d.name; });

    var selectedSpan = selectedIcons
    .enter()
    .append("li")
    .append("span");

    selectedSpan
    .append("strong")
    .style("color", function(d) { return d.color; })
    .text(function(d) { return d.name; });

    selectedIcons
    .exit()
    .remove();
  }

  var legend = d3.select("#lines")
  .attr("class", "list-inline");

  legend.selectAll("li")
  .data(data.lines)
  .enter()
  .append("li")
  .text(function(d) { return d.label })
  .style("color", function(d) { return d.color; });

  d3.select("#visited").select("p").on("click", function() {
    toggle(d3.select("#visited").select("ul"));
  });

  var visitedList = d3.select("#visited").select("ul");

  var drawLists = function() {
    var selectedPubs = visitedList.selectAll("li").data(visitedPubs.values().sort());

    selectedPubs
    .text(function(d) { return d });

    selectedPubs
    .enter()
    .append("li")
    .text(function(d) { return d });

    selectedPubs
    .exit()
    .remove();
  }

  var update = function() {
    drawMarkers();
    drawLabels();
    drawLists();
    drawAwards();


    d3.select("#visited").select("p")
      .text("Visited: " + visitedPubs.size());

    // TODO: pubs contains duplicates so we over count the number of pubs left
    d3.select("#stillToVisit").select("p")
      .text("Pubs left: " + (pubs.length - visitedPubs.size()));

  };

  update();

  // Split long pub names into multiple lines

  labels.selectAll("text")
  .call(wrap);

});

function score(visited, lines) {

  var awards = [
    {
      "name": "Ten",
      "unlocked": false,
      "color": "black"
    },
    {
      "name": "Twenty",
      "unlocked": false,
      "color": "black"
    }
  ];

  if (visited.length >= 10)
  awards[0].unlocked = true;

  if (visited.length >= 20)
  awards[1].unlocked = true;

  lines.forEach(function(line) {
    var award = {
      "name": line.name,
      "unlocked": true,
      "color": line.color,
      "icon": "check-square-o"
    }

    awards[awards.length] = award;

    line.pubs.forEach(function(pub) {
      if (visited.indexOf(pub) < 0) {
        award.unlocked = false;
      }
    })
  });

  return awards;
}

// Render line breaks for svg text
function wrap(text) {
  text.each(function() {
    var text = d3.select(this);
    var lines = text.text().split(/\n/);

    var y = text.attr("y");
    var x = text.attr("x");
    var dy = parseFloat(text.attr("dy"));

    var tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em").text(lines[0]);

    for (var lineNum = 1; lineNum < lines.length; lineNum++) {
      tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", lineNum * 1.1 + dy + "em").text(lines[lineNum])
    };

  });
};

// Toggle visibility of an element
function toggle(el) {
  var display = el.style("display");

  if (display === "block") {
    el.style("display", "none");
  } else {
    el.style("display", "block");
  }
};

function extractPubs(data) {

  var pubs = [];

  data.lines.forEach(function(line) {
    for (node = 0; node < line.nodes.length; node++) {
      var data = line.nodes[node];

      if (!data.hasOwnProperty("name"))
        continue;

      pubs[pubs.length] = {
        "x": data.coords[0] * options.scale + line.shiftCoords[0],
        "y": data.coords[1] * options.scale + line.shiftCoords[1],
        "name": data.name,
        "labelPos": data.labelPos,
        "visited": false,
        "color": line.color,
        "marker": (data.hasOwnProperty("marker")) ? data.marker : "station",
        "hide": data.hide
      }
    }
  });

  return pubs;
}

function drawLines(lines, data) {

  var scale = options.scale;

  data.lines.forEach(function(line) {
    var lineNodes = [];

    lineNodes = line.nodes;

    var shiftCoords = [line.shiftCoords[0]/scale, line.shiftCoords[1]/scale];

    for (var lineNode = 0; lineNode < lineNodes.length; lineNode++) {
      if (lineNode < (lineNodes.length - 1)) {
        var nextNode = lineNodes[lineNode+1];
        var currNode = lineNodes[lineNode];

        var xVal = 0;
        var yVal = 0;
        var direction = "";

        var xDiff = Math.round(currNode.coords[0] - nextNode.coords[0]);
        var yDiff = Math.round(currNode.coords[1] - nextNode.coords[1]);

        var lineStartCorrection = [0, 0];
        var lineEndCorrection = [0, 0];

        if ((xDiff == 0) || (yDiff == 0)) {

          if (lineNode === 0) {
            if (xDiff > 0)
              lineStartCorrection = [options.lineWidth/(4*scale), 0];
            if (xDiff < 0)
              lineStartCorrection = [-options.lineWidth/(4*scale), 0];
            if (yDiff > 0)
              lineStartCorrection = [0, options.lineWidth/(4*scale)];
            if (yDiff < 0)
              lineStartCorrection [ 0, -options.lineWidth/(4*scale)];
          }

          if (lineNode === lineNodes.length - 2) {
            if (xDiff > 0)
              lineEndCorrection = [-options.lineWidth/(4*scale), 0];
            if (xDiff < 0)
              lineEndCorrection = [options.lineWidth/(4*scale), 0];
            if (yDiff > 0)
              lineEndCorrection = [0, -options.lineWidth/(4*scale)];
            if (yDiff < 0)
              lineEndCorrection [ 0, options.lineWidth/(4*scale)];
          }

          lines.append("path")
            .attr("d", lineFunction()([
              [
                currNode.coords[0] + shiftCoords[0] + lineStartCorrection[0],
                currNode.coords[1] + shiftCoords[1] + lineStartCorrection[1]
              ],
              [
                nextNode.coords[0] + shiftCoords[0] + lineEndCorrection[0],
                nextNode.coords[1] + shiftCoords[1] + lineEndCorrection[1]
              ]
            ]))
            .attr("stroke", line.color)
            .attr("stroke-width", options.lineWidth)
            .attr("fill", "none");
        } else if ((Math.abs(xDiff) == 1) && (Math.abs(yDiff) == 1)) {
          direction = nextNode.dir.toLowerCase();
          var phi;
          switch (direction) {
            case "e": if (yDiff > 0) { xVal = 0; yVal = -scale; phi = [Math.PI, Math.PI/2]} else { xVal = 0; yVal = scale; phi = [0, Math.PI/2] }  break;
            case "s": if (xDiff > 0) { xVal = -scale; yVal = 0; phi = [Math.PI/2, Math.PI] } else { xVal = scale; yVal = 0; phi = [3*Math.PI/2, Math.PI]} break;
            case "n": if (xDiff > 0) { xVal = -scale; yVal = 0; phi = [Math.PI/2, 0] } else { xVal = scale; yVal = 0; phi = [3*Math.PI/2, 2*Math.PI]} break;
          }

          lines.append("path")
            .attr("d", curveFunction()(phi))
            .attr("transform", "translate(" + ((currNode.coords[0] + shiftCoords[0]) * scale + xVal) + "," + ((currNode.coords[1] + shiftCoords[1]) * scale + yVal) + ")")
            .attr("fill", line.color);
        }
      }
    }
  });
};

function lineFunction() {
  return d3.svg.line()
    .x(function(d) { return d[0] * options.scale; })
    .y(function(d) { return d[1] * options.scale; })
    .interpolate("linear");
};

function curveFunction() {
  return d3.svg.arc()
    .innerRadius(options.scale - options.lineWidth/2)
    .outerRadius(options.scale + options.lineWidth/2)
    .startAngle(function(angle) { return angle[0]; })
    .endAngle(function(angle) { return angle[1]; });
};
