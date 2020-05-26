"use strict";

require("source-map-support").install();

const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../env") });

console.log("NODE_ENV:", process.env.NODE_ENV);

const express = require("express");

const app = express();
const server = require("http").createServer(app);
require("./config/express")(app);
require("./routes")(app);

server.listen(process.env.PORT, function () {
  console.log(
    "Express server listening on %d, in %s mode",
    process.env.PORT,
    app.get("env")
  );
});

exports = module.exports = app;
