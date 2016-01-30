var Lines = function (lines) {
    this.lines = lines;
};

Lines.prototype.highlightLine = function(name) {
  this.lines.forEach(function(line) {
     if (line.name === name) {
         line.highlighted = true;
     }
  });
};

Lines.prototype.unhighlightLine = function(name) {
    this.lines.forEach(function(line) {
        if (line.name === name) {
            line.highlighted = false;
        }
    });
};