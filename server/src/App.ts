require("source-map-support").install();

import * as path from "path";
import * as express from "express";
import { AppEnv, deserialize } from "./AppEnv";

require("dotenv").config({ path: path.resolve(__dirname, "../../env") });

console.log("NODE_ENV:", process.env.NODE_ENV);
const env = deserialize(process.env.NODE_ENV!);

const errors = require("./components/errors");
const logger = require("./config/logger");
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

function setupRoutes(app: express.Application) {
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
  app.route("/*").get(function (req: express.Request, res: express.Response) {
    res.sendFile("index.html", {
      root: path.join(__dirname, "../../" + app.get("appPath")),
    });
  });
}

function setupErrorHandler(app: express.Application) {
  if (env === AppEnv.PRODUCTION) {
    app.use(function (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) {
      logger.error(err);

      res.status(500);
    });
  } else if (env === AppEnv.DEVELOPMENT) {
    app.use(function (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) {
      logger.error(err);
      next(err);
    });
    app.use(require("errorhandler")());
  }
}

app.set("views", config.root + "/server/views");
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.use(compression());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(cookieParser());
app.use(passport.initialize());

if (env === AppEnv.PRODUCTION) {
  //app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));
  app.use(express.static(path.join(config.root, "public")));
  app.set("appPath", "/public");
  app.use(morgan("combined", { stream: logger.stream }));
}

if (env === AppEnv.DEVELOPMENT) {
  app.use(morgan("dev", { stream: logger.stream }));
}

if (env === AppEnv.DEVELOPMENT || env === AppEnv.TEST) {
  app.use(require("connect-livereload")());
  app.use(express.static(path.join(config.root, ".tmp")));
  app.use(express.static(path.join(config.root, "client")));
  app.set("appPath", "client");
}

setupRoutes(app);
setupErrorHandler(app);

server.listen(process.env.PORT, function () {
  console.log(
    "Express server listening on %d, in %s mode",
    process.env.PORT,
    env
  );
});

export default app;
