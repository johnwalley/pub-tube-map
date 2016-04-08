export default function() {
  return function(input) {
    input = input || '';

    if (input.match(/http:\/\//)) {
      input = input.substring(7);
    }

    // TODO: Learn to write regular expressions
    if (input.match(/https:\/\//)) {
      input = input.substring(8);
    }

    if (input.match(/^www\./)) {
      input = input.substring(4);
    }

    if(input.substr(-1) === '/') {
        input = input.substr(0, input.length - 1);
    }

    return input;
  };
};
