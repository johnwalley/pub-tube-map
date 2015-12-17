//Parse.initialize("viYcdJsQzu51MuROsQnEToQYhyK5CkQa7lmcUmQV", "NpR8DaCfiMwXgP7OtfUkKrduhexjD74oMmVmrZXj");

var options = {};

d3.json("pubs.json", function(data) {
  options.rows = data.rows;
  options.columns = data.columns;

  var scale = data.cellSize;
  var lineWidth = data.lineWidth;
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

  var lineFunction = d3.svg.line()
  .x(function(d) { return d[0] * scale; })
  .y(function(d) { return d[1] * scale; })
  .interpolate("linear");

  var lineFunctionUnscaled = d3.svg.line()
  .x(function(d) { return d[0]; })
  .y(function(d) { return d[1]; })
  .interpolate("linear");

  var curveFunction = d3.svg.arc()
  .innerRadius(scale - lineWidth/2)
  .outerRadius(scale + lineWidth/2)
  .startAngle(function(angle) { return angle[0]; })
  .endAngle(function(angle) { return angle[1]; });

  var markerFunction = d3.svg.arc()
  .innerRadius(0)
  .outerRadius(lineWidth/2)
  .startAngle(0)
  .endAngle(2*Math.PI);

  var lines = svg.append("g");

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
            lineStartCorrection = [lineWidth/(4*scale), 0];
            if (xDiff < 0)
            lineStartCorrection = [-lineWidth/(4*scale), 0];
            if (yDiff > 0)
            lineStartCorrection = [0, lineWidth/(4*scale)];
            if (yDiff < 0)
            lineStartCorrection [ 0, -lineWidth/(4*scale)];
          }

          if (lineNode === lineNodes.length - 2) {
            if (xDiff > 0)
            lineEndCorrection = [-lineWidth/(4*scale), 0];
            if (xDiff < 0)
            lineEndCorrection = [lineWidth/(4*scale), 0];
            if (yDiff > 0)
            lineEndCorrection = [0, -lineWidth/(4*scale)];
            if (yDiff < 0)
            lineEndCorrection [ 0, lineWidth/(4*scale)];
          }

          lines.append("path")
          .attr("d", lineFunction([
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
          .attr("stroke-width", lineWidth)
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
          .attr("d", curveFunction(phi))
          .attr("transform", "translate(" + ((currNode.coords[0] + shiftCoords[0]) * scale + xVal) + "," + ((currNode.coords[1] + shiftCoords[1]) * scale + yVal) + ")")
          .attr("fill", line.color);
        }
      }
    }
  });

  var extractPubs = function(data) {

    var pubs = [];

    data.lines.forEach(function(line) {
      for (node = 0; node < line.nodes.length; node++) {
        var data = line.nodes[node];

        if (!data.hasOwnProperty("name"))
        continue;

        pubs[pubs.length] = {
          "x": data.coords[0] * scale + line.shiftCoords[0],
          "y": data.coords[1] * scale + line.shiftCoords[1],
          "name": data.name,
          "labelPos": data.labelPos,
          "visited": false,
          "color": line.color,
          "marker": (data.hasOwnProperty("marker")) ? data.marker : "station"
        }
      }
    });

    return pubs;
  }


  var pubs = extractPubs(data)

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

  var addPub = function(pub) {
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
    var offset = lineWidth * 2.6;

    switch (data.labelPos.toLowerCase()) {
      case "n":
      pos = [0, -offset*2];
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
      pos = [-offset, offset];
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

  var drawMarkers = function() {

    var interchangePubs = pubs.filter(function(d) { return d.marker === "interchange"; });

    interchangeMarkers.selectAll("path")
    .data(interchangePubs)
    .attr("fill", function(d) { return d.visited ? fgColor : bgColor; })
    .attr("stroke", function(d) { return d.visited ? bgColor : fgColor; })
    .enter()
    .append("path")
    .attr("d", markerFunction)
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" })
    .attr("fill", bgColor)
    .attr("stroke", fgColor)
    .attr("stroke-width", lineWidth/4)
    .on("click", function(d) { addPub(d)(); });

    var stationPubs = pubs.filter(function(d) { return d.marker === "station"; });

    var length = lineWidth;

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

      return lineFunctionUnscaled([[d.x, d.y], [d.x + length*dir[0], d.y + length*dir[1]]]);
    })
    .attr("stroke", function(d) { return d.color; })
    .attr("stroke-width", lineWidth/2)
    .attr("fill", "none")
    .on("click", function(d) { return addPub(d)(); });
  }

  var labels = svg.append("g");

  var drawLabels = function() {

    labels.selectAll("text")
    .data(pubs)
    .attr("font-weight", function(d) { return (d.visited ? "bold" : "normal"); })
    .enter()
    .append("text")
    .text(function(d) { return d.name })
    .attr("x", function(d) { return d.x + textPos(d).pos[0]; })
    .attr("y", function(d) { return d.y + textPos(d).pos[1] + 4; })
    .attr("dy", .1)
    .attr("font-family", "sans-serif")
    .attr("text-anchor", function(d) { return textPos(d).textAnchor })
    .on("click", function(d) { return addPub(d)(); });
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

  d3.select("#visited").select("p").on("click", function() { d3.select("#visited").select("ul").style("display", "none"); });

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

    d3.select("#visited").select("p")
    .text("Visited: " + visitedPubs.size());

    d3.select("#stillToVisit")
    .text("Pubs left: " + (pubs.length - visitedPubs.size()));

    drawAwards();
  };

  update();

  // Split long pub names into multiple lines
  labels.selectAll("text")
  .call(wrap, 100);

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

function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
    words = text.text().split(/\s+/).reverse(),
    word,
    line = [],
    lineNumber = 0,
    lineHeight = 1.1, // ems
    y = text.attr("y"),
    x = text.attr("x"),
    dy = parseFloat(text.attr("dy")),
    tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}
