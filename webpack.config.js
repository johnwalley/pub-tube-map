var path = require('path');

module.exports = {
  entry: "./src/main.js",
  devtool: 'source-map',
  output: {
    path: __dirname,
    filename: "bundle.js"
  },
  module: {
    loaders: [
      // SASS one omitted
      {
        test: /\.js$/,
        loader: 'babel',
        include: path.resolve(__dirname, 'src')
      }, {
        test: /\.css$/,
        loader: "style-loader!css-loader"
      }
    ]
  }
};
