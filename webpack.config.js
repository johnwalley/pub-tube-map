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
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          loader: "style-loader!css-loader"
        }
      ]
    }
};
