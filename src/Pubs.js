var Pubs = function (pubs) {
    this.pubs = pubs;
};

Pubs.prototype.toArray = function() {
    var pubs = [];

    for (var name in this.pubs) {
        if (this.pubs.hasOwnProperty(name)) {
            var pub = this.pubs[name];
            pub.name = name;
            pubs.push(pub);
        }
    }

    return pubs;
};

Pubs.prototype.interchanges = function () {
    var interchangePubs = this.toArray();

    return interchangePubs.filter(function(pub) { return pub.marker[0].marker === "interchange" });
};

Pubs.prototype.stations = function () {
    var pubs = this.toArray();

    var stationPubs = pubs.filter(function(pub) { return pub.marker[0].marker !== "interchange"; });

    var stationMarkers = [];

    stationPubs.forEach(function(station) {
        station.marker.forEach(function(marker) {
           stationMarkers.push(
               {
                   "x": station.x,
                   "y": station.y,
                   "color": marker.color,
                   "shiftX": marker.shiftX,
                   "shiftY": marker.shiftY,
                   "labelPos": station.labelPos
               }
           );
        });
    });

    return stationMarkers;
};

Pubs.prototype.visited = function() {
    var visitedPubs = this.toArray();

    return visitedPubs.filter(function(pub) { return pub.visited; });
};

Pubs.prototype.visitedFriendly = function() {
    var visitedPubs = this.visited();

    return visitedPubs.map(function(pub) { return pub.title; });
};

Pubs.prototype.isVisited = function(name) {
    return this.pubs[name].visited;
};