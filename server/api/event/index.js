"use strict";

const express = require("express");
const addonController = require("./event-product.controller");
const auth = require("../../auth/auth.service");
const router = express.Router();

const logger = require("../../config/logger");
const { EventController } = require("../../event/EventController");

const db = require("../../db/futureDb");
const { EventRepository } = require("../../event/EventRepository");
const { SqlProvider } = require("../../SqlProvider");
const eventRepository = new EventRepository(db, SqlProvider);
const controller = new EventController(eventRepository);

router.get("/public", async (req, res, next) => {
  const slug = req.query.url;
  try {
    const response = await controller.showPublic(slug);
    return res.status(200).json(response);
  } catch (e) {
    logger.error(e);
    return res.sendStatus(400);
  }
});

router.get("/", auth.isAuthenticated(), async (req, res, next) => {
  try {
    const response = await controller.all();
    return res.status(200).json(response);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", auth.isAuthenticated(), async (req, res, next) => {
  const id = req.params.id;
  try {
    const response = await controller.show(id);
    return res.status(200).json(response);
  } catch (e) {
    logger.error(e);
    return res.sendStatus(400);
  }
});

router.put("/:id", auth.isAuthenticated(), async (req, res, next) => {
  try {
    const params = Object.assign(req.body, { id: req.params.id });
    await controller.update(params);
    return res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    return res.sendStatus(400);
  }
});

router.post("/", auth.isAuthenticated(), async (req, res, next) => {
  try {
    const response = await controller.create(req.body);
    return res.status(200).json(response);
  } catch (e) {
    logger.error(e);
    return res.sendStatus(400);
  }
});

router.delete("/:id", auth.isAuthenticated(), async (req, res, next) => {
  try {
    await controller.destroy(req.params.id);
    return res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    return res.sendStatus(400);
  }
});

router.post(
  "/:eventId/addon",
  auth.isAuthenticated(),
  async (req, res, next) => {
    try {
      await controller.createAddon(req.params.eventId, req.body);
      return res.sendStatus(200);
    } catch (e) {
      logger.error(e);
      return res.sendStatus(400);
    }
  }
);

router.delete(
  "/:eventId/addon/:addonId",
  auth.isAuthenticated(),
  async (req, res, next) => {
    try {
      await controller.deleteAddon(req.params.eventId, req.params.addonId);
      return res.sendStatus(200);
    } catch (e) {
      logger.error(e);
      return res.sendStatus(400);
    }
  }
);

router.put(
  "/:eventId/addon/:addonId",
  auth.isAuthenticated(),
  async (req, res, next) => {
    try {
      await controller.updateAddon(
        +req.params.eventId,
        +req.params.addonId,
        req.body
      );
      return res.sendStatus(200);
    } catch (e) {
      logger.error(e);
      return res.sendStatus(400);
    }
  }
);

module.exports = router;
