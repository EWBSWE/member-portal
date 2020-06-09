"use strict";

var express = require("express");
var passport = require("passport");
var config = require("../config/environment");

require("./local/passport").setup(config);

var router = express.Router();

router.use("/local", require("./local"));

module.exports = router;
