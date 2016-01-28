var log = log4javascript.getLogger("main");
consoleAppender = new log4javascript.BrowserConsoleAppender();
log.addAppender(consoleAppender);

var options = {};

var visitedPubs = d3.set();

// Set up svg elements
var svg = d3.select("#map");
var river = svg.append("g").attr("id", "river");
var linesElement = svg.append("g").attr("id", "lines");
var interchangeMarkers = svg.append("g").attr("id", "interchanges");
var markers = svg.append("g").attr("id", "stations");
var labels = svg.append("g").attr("id", "labels");

var legend = d3.select("ul#lines").attr("class", "list-inline");
var progress = d3.select("#progress");
var visitedList = d3.select("#visited").select("ul");

var minX = Infinity;
var maxX = -Infinity;
var minY = Infinity;
var maxY = -Infinity;

d3.json("pubs.json", function(d) {
  log.info("Successfully loaded pubs.json");

  d.lines.forEach(function(line) {
    line.nodes.forEach(function(node) {
      if (node.coords[0] < minX)
        minX = node.coords[0];

      if (node.coords[0] > maxX)
        maxX = node.coords[0];

      if (node.coords[1] < minY)
        minY = node.coords[1];

      if (node.coords[1] > maxY)
        maxY = node.coords[1];
    })
  });

  var data = { "raw": d.lines };

  // Data manipulation
  data.river = d.river;
  data.pubs = extractPubs(d.lines);
  data.lines = extractLines(d.lines);

  d3.select("#visited").select("p").on("click", function() {
    toggle(d3.select("#visited").select("ul"));
  });

  // Update on window resize
  d3.select(window).on('resize', resizeFunc(data));

  // Initial draw
  update(data);
});

function drawPubLists(data) {
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

  var visited = visitedPubs.size();

  var total = data.pubs
    .map(function(pub) { return pub.name; })
    .filter(function(value, index, self) { return self.indexOf(value) === index; }).length;  // Unique elements

  d3.select("#visited").select("p")
    .text("Visited: " + visited + "/" + total);
}

function update(data) {
  var w = parseInt(d3.select("#map").style("width"));
  var h = parseInt(d3.select("#map").style("height"));

  log.debug("SVG container dimensions: " + w + "x" + h);

  var xMargin = w/7;
  var yMargin = h/10;

  var desiredAspectRatio = (maxX - minX) / (maxY - minY);
  var actualAspectRatio = (w - 2*xMargin)/(h - 2*yMargin);

  log.debug("desiredAspectRatio: " + desiredAspectRatio);
  log.debug("actualAspectRatio: " + actualAspectRatio);

  // Note that we flip the sense of the y-axis here
  if (desiredAspectRatio > actualAspectRatio) {
    // Container is too tall
    options.xScale = d3.scale.linear().domain([minX, maxX]).range([xMargin, w - xMargin]);
    options.yScale = d3.scale.linear().domain([minY, maxY]).range([(h - yMargin) * actualAspectRatio / desiredAspectRatio, yMargin * actualAspectRatio / desiredAspectRatio]);
  } else {
    log.debug("Container is too wide");
    options.xScale = d3.scale.linear().domain([minX, maxX]).range([xMargin * desiredAspectRatio / actualAspectRatio, (w - xMargin) * desiredAspectRatio / actualAspectRatio ]);
    options.yScale = d3.scale.linear().domain([minY, maxY]).range([h - yMargin, yMargin]);
  }

  options.lineWidth = (options.xScale(1) - options.xScale(0))/1.2;

  drawRiver(data.river);
  drawLines(data.raw);
  drawMarkers(data);
  drawLabels(data);
  drawPubLists(data);
  drawLegend(data);
}

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
    };

    awards.push(award);

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
    }

  });
}

// Toggle visibility of an element
function toggle(el) {
  var display = el.style("display");

  if (display === "block") {
    el.style("display", "none");
  } else {
    el.style("display", "block");
  }
}

function extractLines(data) {
  var lines = [];

  data.forEach(function(line) {

    var lineObj = {
      "name": line.label,
      "pubs": [],
      "color": line.color,
      "shiftCoords": line.shiftCoords
    };

    lines.push(lineObj);

    for (var node = 0; node < line.nodes.length; node++) {
      var data = line.nodes[node];

      if (!data.hasOwnProperty("name"))
      continue;

      lineObj.pubs.push(data.name);
    }
  });

  return lines;
}

function extractPubs(data) {
  var pubs = [];

  data.forEach(function(line) {
    for (var node = 0; node < line.nodes.length; node++) {
      var data = line.nodes[node];

      if (!data.hasOwnProperty("name"))
        continue;

      pubs.push({
        "x": data.coords[0],
        "y": data.coords[1],
        "shiftX": data.hasOwnProperty("shiftCoords") ? data.shiftCoords[0] : line.shiftCoords[0],
        "shiftY": data.hasOwnProperty("shiftCoords") ? data.shiftCoords[1] : line.shiftCoords[1],
        "name": data.name,
        "labelPos": data.labelPos,
        "visited": false,
        "color": line.color,
        "marker": (data.hasOwnProperty("marker")) ? data.marker : "station",
        "hide": data.hide
      });
    }
  });

  return pubs;
}

function drawRiver(data) {
  var unitLength = (options.xScale(1) - options.xScale(0));

  var g = river.selectAll("path").data([data]);

  g.enter().append("path")
      .attr("stroke", "#C4E8F8")
      .attr("fill", "#ffffff"); //"#C4E8F8")

  g.attr("d", function(d) { return tubeLine(d); })
    .attr("stroke-width", 2.0*unitLength);
}

function drawLines(data) {
  // DATA JOIN
  // Join new data with old elements, if any
  var g = linesElement.selectAll("path").data(data);

  // UPDATE
  // Update old elements as needed

  // ENTER
  // Create new elements as needed
  g.enter().append("path")
    .attr("id", function(d) { return d.label; })
    .attr("stroke", function(d) { return d.color; })
    .attr("fill", "none");

  // ENTER + UPDATE
  // Appending to the enter selection expands the update selection to include
  // entering elements; so, operations on the update selection after appending to
  // the enter selection will apply to both entering and updating nodes
  g.attr("d", function(d) { return tubeLine(d); })
    .attr("stroke-width", options.lineWidth);

}

function drawMarkers(data) {
  var pubs = data.pubs;

  var unitLength = (options.xScale(1) - options.xScale(0));

  var interchangePubsList = pubs.filter(function(d) { return d.marker === "interchange" && d.hide != true; });

  var fgColor = "#000000";
  var bgColor = "#ffffff";

  var markerFunction = d3.svg.arc()
      .innerRadius(0)
      .outerRadius(options.lineWidth)
      .startAngle(0)
      .endAngle(2*Math.PI);

  // DATA JOIN
  // Join new data with old elements, if any
  var interchangePubs = interchangeMarkers.selectAll("path")
    .data(interchangePubsList);

  // UPDATE
  // Update old elements as needed
  interchangePubs
    .attr("fill", function(d) { return d.visited ? fgColor : bgColor; })
    .attr("stroke", function(d) { return d.visited ? bgColor : fgColor; });

  // ENTER
  // Create new elements as needed
  interchangePubs.enter()
    .append("path")
    .attr("fill", bgColor)
    .attr("stroke", fgColor)
    .style("cursor", "pointer")
    .on("click", function(d) { togglePub(d, data)(); });

  // ENTER + UPDATE
  // Appending to the enter selection expands the update selection to include
  // entering elements; so, operations on the update selection after appending to
  // the enter selection will apply to both entering and updating nodes
  interchangePubs.attr("transform", function(d) { return "translate(" + options.xScale(d.x + d.shiftX*options.lineWidth/unitLength) + "," + options.yScale(d.y + d.shiftY*options.lineWidth/unitLength) + ")" })
    .attr("d", markerFunction)
    .attr("stroke-width", options.lineWidth/4);


  // EXIT
  // Remove old elements as needed.
  interchangePubs.exit().remove();

  var stationPubs = pubs.filter(function(d) { return d.marker === "station"; });

  var length = options.lineWidth / unitLength;

  var normalPubs = markers.selectAll("path")
    .data(stationPubs);

  // ENTER
  // Create new elements as needed
  normalPubs.enter()
    .append("path")
    .style("cursor", "pointer");

  // ENTER + UPDATE
  // Appending to the enter selection expands the update selection to include
  // entering elements; so, operations on the update selection after appending to
  // the enter selection will apply to both entering and updating nodes
  normalPubs.attr("d", function(d) {
    var dir;

    switch (d.labelPos.toLowerCase()) {
      case "n":
        dir = [0, 1];
        break;
      case "ne":
        dir = [1/Math.sqrt(2), 1/Math.sqrt(2)];
        break;
      case "e":
        dir = [1, 0];
        break;
      case "se":
        dir = [1/Math.sqrt(2), -1/Math.sqrt(2)];
        break;
      case "s":
        dir = [0, -1];
        break;
      case "sw":
        dir = [-1/Math.sqrt(2), -1/Math.sqrt(2)];
        break;
      case "w":
        dir = [-1, 0];
        break;
      case "nw":
        dir = [-1/Math.sqrt(2), 1/Math.sqrt(2)];
        break;
      default:
        log.error(d.labelPos + ": unexpected value");
        break;
    }

    return lineFunction()([[d.x + (d.shiftX*options.lineWidth/unitLength), d.y + (d.shiftY*options.lineWidth/unitLength)], [d.x + (d.shiftX*options.lineWidth/unitLength) + length*dir[0], d.y + (d.shiftY*options.lineWidth/unitLength) + length*dir[1]]]);
  })
    .attr("stroke", function(d) { return d.color; })
    .attr("stroke-width", options.lineWidth/2)
    .attr("fill", "none")
    .on("click", function(d) { return togglePub(d, data)(); });
}

function lineFunction() {
  return d3.svg.line()
    .x(function(d) { return options.xScale(d[0]); })
    .y(function(d) { return options.yScale(d[1]); })
    .interpolate("linear");
}

function resizeFunc(data) {
  return function() {
    update(data);
  }
}

function drawLabels(data) {
  var pubs = data.pubs;

  var unitLength = (options.xScale(1) - options.xScale(0));

  // DATA JOIN
  // Join new data with old elements, if any
  var text = labels.selectAll("text")
    .data(pubs);

  // UPDATE
  // Update old elements as needed

  // ENTER
  // Create new elements as needed
  text.enter()
    .append("text")
    .attr("id", function(d) { return d.name })
    .attr("dy", .1)
    .on("click", function(d) { return togglePub(d, data)(); });

  // ENTER + UPDATE
  // Appending to the enter selection expands the update selection to include
  // entering elements; so, operations on the update selection after appending to
  // the enter selection will apply to both entering and updating nodes
  text.text(function(d) { return d.name })
    .attr("x", function(d) { return options.xScale(d.x + d.shiftX) + textPos(d).pos[0]; })
    .attr("y", function(d) { return options.yScale(d.y + d.shiftY) - textPos(d).pos[1]; }) // Flip y-axis
    .attr("text-anchor", function(d) { return textPos(d).textAnchor })
    .style("display", function(d) { return d.hide != true ? "block" : "none"; })
    .classed("highlighted", function(d) { return d.visited; })
    .style("font-size", unitLength + "px")
    .call(wrap);

  // EXIT
  // Remove old elements as needed.
  text.exit().remove();
}

function textPos(data) {
  var pos;
  var textAnchor;
  var offset = options.lineWidth * 2;

  var numLines = data.name.split(/\n/).length;

  switch (data.labelPos.toLowerCase()) {
    case "n":
      pos = [0, offset * numLines];
      textAnchor = "middle";
      break;
    case "ne":
      pos = [offset / Math.sqrt(2), offset * numLines / Math.sqrt(2)];
      textAnchor = "start";
      break;
    case "e":
      pos = [offset, 0];
      textAnchor = "start";
      break;
    case "se":
      pos = [offset / Math.sqrt(2), -offset / Math.sqrt(2)];
      textAnchor = "start";
      break;
    case "s":
      pos = [0, -1.2*offset];
      textAnchor = "middle";
      break;
    case "sw":
      pos = [-offset*0.7, -offset];
      textAnchor = "end";
      break;
    case "w":
      pos = [-1.2*offset, 0];
      textAnchor = "end";
      break;
    case "nw":
      pos = [-1.2*offset, offset];
      textAnchor = "end";
      break;
    default:
      log.error(data.labelPos + " not one of the expected values, e.g. 'N', 'SW'");
      break;
  }

  return {
    "pos": pos,
    "textAnchor": textAnchor
  }
}

function togglePub(pub, data) {
  return function() {
    if (visitedPubs.has(pub.name)) {
      visitedPubs.remove(pub.name);
      pub.visited = false;
    } else {
      visitedPubs.add(pub.name);
      pub.visited = true;
    }

    update(data);
  }
}

function tubeLine(data) {
  var path = "";

  var lineNodes = data.nodes;

  var unitLength = (options.xScale(1) - options.xScale(0));

  var shiftCoords = [data.shiftCoords[0]*options.lineWidth/unitLength, data.shiftCoords[1]*options.lineWidth/unitLength];

  var lastSectionType = "";
  var nextNode, currNode, xDiff, yDiff;
  var points;

  for (var lineNode = 0; lineNode < lineNodes.length; lineNode++) {
    if (lineNode > 0) {
      nextNode = lineNodes[lineNode];
      currNode = lineNodes[lineNode - 1];

      var direction = "";

      xDiff = Math.round(currNode.coords[0] - nextNode.coords[0]);
      yDiff = Math.round(currNode.coords[1] - nextNode.coords[1]);

      var lineEndCorrection = [0, 0];

      if (lineNode === lineNodes.length - 1) {
        if ((xDiff == 0) || (yDiff == 0)) {
          if (xDiff > 0)
            lineEndCorrection = [-options.lineWidth / (4 * unitLength), 0];
          if (xDiff < 0)
            lineEndCorrection = [options.lineWidth / (4 * unitLength), 0];
          if (yDiff > 0)
            lineEndCorrection = [0, -options.lineWidth / (4 * unitLength)];
          if (yDiff < 0)
            lineEndCorrection = [0, options.lineWidth / (4 * unitLength)];
        } else {
          if ((xDiff > 0) && (yDiff > 0))
            lineEndCorrection = [-options.lineWidth / (4 * unitLength * Math.sqrt(2)), -options.lineWidth / (4 * unitLength * Math.sqrt(2))];
          if ((xDiff > 0) && (yDiff < 0))
            lineEndCorrection = [-options.lineWidth / (4 * unitLength * Math.sqrt(2)), options.lineWidth / (4 * unitLength * Math.sqrt(2))];
          if ((xDiff < 0) && (yDiff > 0))
            lineEndCorrection = [options.lineWidth / (4 * unitLength * Math.sqrt(2)), -options.lineWidth / (4 * unitLength * Math.sqrt(2))];
          if ((xDiff < 0) && (yDiff < 0))
            lineEndCorrection = [options.lineWidth / (4 * unitLength * Math.sqrt(2)), options.lineWidth / (4 * unitLength * Math.sqrt(2))];
        }
      }

      points = [
        [
          options.xScale(currNode.coords[0] + shiftCoords[0]),
          options.yScale(currNode.coords[1] + shiftCoords[1])
        ],
        [
          options.xScale(nextNode.coords[0] + shiftCoords[0] + lineEndCorrection[0]),
          options.yScale(nextNode.coords[1] + shiftCoords[1] + lineEndCorrection[1])
        ]
      ];

      if ((xDiff == 0) || (yDiff == 0)) {
        lastSectionType = "udlr";
        path += "L" + points[1][0] + "," + points[1][1];
      } else if ((Math.abs(xDiff) == Math.abs(yDiff)) && (Math.abs(xDiff) > 1)) {
        lastSectionType = "diagonal";
        path += "L" + points[1][0] + "," + points[1][1];
      }
      else if ((Math.abs(xDiff) == 1) && (Math.abs(yDiff) == 1)) {
        direction = nextNode.dir.toLowerCase();

        switch (direction) {
          case "e":
            path += "Q" + points[1][0] + "," + points[0][1] + "," + points[1][0] + "," + points[1][1];
            break;
          case "s":
            path += "Q" + points[0][0] + "," + points[1][1] + "," + points[1][0] + "," + points[1][1];
            break;
          case "n":
            path += "Q" + points[0][0] + "," + points[1][1] + "," + points[1][0] + "," + points[1][1];
            break;
          case "w":
            path += "Q" + points[1][0] + "," + points[0][1] + "," + points[1][0] + "," + points[1][1];
            break;            
        }
      }
      else if (((Math.abs(xDiff) == 1) && (Math.abs(yDiff) == 2)) || ((Math.abs(xDiff) == 2) && (Math.abs(yDiff) == 1))) {
        var controlPoints;
        if (xDiff == 1) {
          if (yDiff == 1) {
            if (lastSectionType == "udlr") {
              controlPoints = [
                points[0][0],
                points[0][1] + (points[1][1] - points[0][1]) / 2
              ];
            } else if (lastSectionType == "diagonal") {
              controlPoints = [
                points[1][0],
                points[0][1] + (points[1][1] - points[0][1]) / 2
              ];
            }
          } else {
            if (lastSectionType == "udlr") {
              controlPoints = [
                points[0][0],
                points[0][1] + (points[1][1] - points[0][1]) / 2
              ];
            } else if (lastSectionType == "diagonal") {
              controlPoints = [
                points[1][0],
                points[0][1] + (points[1][1] - points[0][1]) / 2
              ];
            }
          }
        } else if (xDiff == -1) {
          if (lastSectionType == "udlr") {
            controlPoints = [
              points[0][0],
              points[0][1] + (points[1][1] - points[0][1])/2
            ];  
          } else if (lastSectionType == "diagonal") {
            controlPoints = [
              points[1][0],
              points[0][1] + (points[1][1] - points[0][1])/2
            ];
          }
        } else if (xDiff == -2) {
          if (lastSectionType == "udlr") {
            controlPoints = [
              points[0][0],
              points[0][1] + (points[1][1] - points[0][1]) / 2
            ];
          } else if (lastSectionType == "diagonal") {
            controlPoints = [
              points[0][0] + (points[1][0] - points[0][0]) / 2,
              points[1][1]
            ];
          }
        }

        path += "C" + controlPoints[0] + "," + controlPoints[1] + "," + controlPoints[0] + "," + controlPoints[1] + "," + points[1][0] + "," + points[1][1];     
      }
    } else {
      nextNode = lineNodes[lineNode + 1];
      currNode = lineNodes[lineNode];

      xDiff = Math.round(currNode.coords[0] - nextNode.coords[0]);
      yDiff = Math.round(currNode.coords[1] - nextNode.coords[1]);

      var lineStartCorrection = [0, 0];

      if ((xDiff == 0) || (yDiff == 0)) {
        if (xDiff > 0)
          lineStartCorrection = [options.lineWidth / (4 * unitLength), 0];
        if (xDiff < 0)
          lineStartCorrection = [-options.lineWidth / (4 * unitLength), 0];
        if (yDiff > 0)
          lineStartCorrection = [0, options.lineWidth / (4 * unitLength)];
        if (yDiff < 0)
          lineStartCorrection = [0, -options.lineWidth / (4 * unitLength)];
      } else {
        if ((xDiff > 0) && (yDiff > 0))
          lineStartCorrection = [options.lineWidth / (4 * unitLength * Math.sqrt(2)), options.lineWidth / (4 * unitLength * Math.sqrt(2))];
        if ((xDiff > 0) && (yDiff < 0))
          lineStartCorrection = [options.lineWidth / (4 * unitLength * Math.sqrt(2)), -options.lineWidth / (4 * unitLength * Math.sqrt(2))];
        if ((xDiff < 0) && (yDiff > 0))
          lineStartCorrection = [-options.lineWidth / (4 * unitLength * Math.sqrt(2)), options.lineWidth / (4 * unitLength * Math.sqrt(2))];
        if ((xDiff < 0) && (yDiff < 0))
          lineStartCorrection = [-options.lineWidth / (4 * unitLength * Math.sqrt(2)), -options.lineWidth / (4 * unitLength * Math.sqrt(2))];
      }

      points = [
        options.xScale(currNode.coords[0] + shiftCoords[0] + lineStartCorrection[0]),
        options.yScale(currNode.coords[1] + shiftCoords[1] + lineStartCorrection[1])
      ];

      path += "M" + points[0] + "," + points[1];
    }
  }

  return path;
}

function drawLegend(data) {
  var awards = score(visitedPubs.values(), data.lines);

  var filteredAwards = awards.filter(function(award) { return award.unlocked === true; });

  var filteredNames = filteredAwards.map(function(d) { return d.name; });

  // DATA JOIN
  // Join new data with old elements, if any
  var lines = legend.selectAll("li")
    .data(data.lines);

  // UPDATE
  // Update old elements as needed

  // ENTER
  // Create new elements as needed
  lines.enter()
    .append("li")
    .text(function(d) { return d.name })
    .style("color", function(d) { return d.color; });

  // ENTER + UPDATE
  // Appending to the enter selection expands the update selection to include
  // entering elements; so, operations on the update selection after appending to
  // the enter selection will apply to both entering and updating nodes
  lines.style("text-decoration", function(d) {
    var found = (filteredNames.indexOf(d.name) > -1);

    return found ? "line-through" : "none";
  });

  // EXIT
  // Remove old elements as needed.
  lines.exit().remove();
}