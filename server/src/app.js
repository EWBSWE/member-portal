"use strict";

require("source-map-support").install();

const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../../env") });

console.log("NODE_ENV:", process.env.NODE_ENV);
const env = process.env.NODE_ENV;

const errors = require("./components/errors");
const logger = require("./config/logger");
const express = require("express");
const favicon = require("serve-favicon");
const morgan = require("morgan");
const compression = require("compression");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const config = require("./config/environment");
const passport = require("passport");

const app = express();
const server = require("http").createServer(app);

app.set("views", config.root + "/server/views");
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.use(compression());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(cookieParser());
app.use(passport.initialize());

if ("production" === env) {
  //app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));
  app.use(express.static(path.join(config.root, "public")));
  app.set("appPath", "/public");
  app.use(morgan("combined", { stream: logger.stream }));
}

if (env === "development") {
  app.use(morgan("dev", { stream: logger.stream }));
}

if ("development" === env || "test" === env) {
  app.use(require("connect-livereload")());
  app.use(express.static(path.join(config.root, ".tmp")));
  app.use(express.static(path.join(config.root, "client")));
  app.set("appPath", "client");
}

app.use("/api/members", require("./member/MemberRouter").default);
app.use("/api/events", require("./event/EventRouter").default);
app.use("/api/payments", require("./payment/PaymentRouter").default);
app.use("/api/products", require("./product/ProductRouter").default);
app.use("/api/stats", require("./stats/StatsRouter").default);
app.use("/api/users", require("./user/UserRouter").default);

app.use("/auth", require("./auth"));

// All undefined asset or api routes should return a 404
app
  .route("/:url(api|auth|components|app|bower_components|assets)/*")
  .get(errors[404]);

// All other routes should redirect to the index.html
app.route("/*").get(function (req, res) {
  res.sendFile("index.html", {
    root: path.join(__dirname, "../../" + app.get("appPath")),
  });
});

if (env === "production") {
  app.use(function (err, req, res, next) {
    logger.error(err);

    res
      .status(err.status || 500)
      .json({ status: "error", message: err.message });
  });
}

if (env === "development") {
  app.use(function (err, req, res, next) {
    logger.error(err);
    next(err);
  });
  app.use(require("errorhandler")());
}

server.listen(process.env.PORT, function () {
  console.log(
    "Express server listening on %d, in %s mode",
    process.env.PORT,
    app.get("env")
  );
});

exports = module.exports = app;
