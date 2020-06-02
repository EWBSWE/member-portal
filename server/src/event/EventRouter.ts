import * as express from "express";
import * as auth from "../auth/auth.service";
import { SqlProvider } from "../SqlProvider";
import * as logger from "../config/logger";
import { db } from "../db";
import { EventRepository } from "./EventRepository";
import { EventController } from "./EventController";
import { parseUpdateAddonRequest } from "./UpdateAddonRequest";
import {
  parseCreateAddonRequest,
  CreateAddonRequest,
} from "./CreateAddonRequest";
import { parseCreateEventRequest } from "./CreateEventRequest";
import { parseUpdateEventRequest } from "./UpdateEventRequest";
import { createHandler, createHandlerNoInput } from "../createHandler";

const router = express.Router();

const eventRepository = new EventRepository(db, SqlProvider);
const controller = new EventController(eventRepository);

router.get("/public", async (req, res, next) => {
  const slug = req.query.url;
  try {
    const response = await controller.showPublic(slug as string);
    return res.status(200).json(response);
  } catch (e) {
    logger.error(e);
    return res.sendStatus(400);
  }
});

router.get(
  "/",
  auth.isAuthenticated(),
  createHandlerNoInput(controller.all.bind(controller))
);

router.get("/:id", auth.isAuthenticated(), async (req, res, next) => {
  const id = req.params.id;
  try {
    const response = await controller.show(+id);
    return res.status(200).json(response);
  } catch (e) {
    logger.error(e);
    return res.sendStatus(400);
  }
});

router.put("/:id", auth.isAuthenticated(), async (req, res, next) => {
  try {
    const maybeParams = parseUpdateEventRequest(
      Object.assign(req.body, { id: req.params.id })
    );
    if (!maybeParams.success) return res.sendStatus(400);
    await controller.update(maybeParams.value);
    return res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    return res.sendStatus(400);
  }
});

router.post("/", auth.isAuthenticated(), async (req, res, next) => {
  try {
    const maybeParams = parseCreateEventRequest(req.body);
    if (!maybeParams.success) return res.sendStatus(400);
    const response = await controller.create(maybeParams.value);
    return res.status(200).json(response);
  } catch (e) {
    logger.error(e);
    return res.sendStatus(400);
  }
});

router.delete("/:id", auth.isAuthenticated(), async (req, res, next) => {
  try {
    await controller.destroy(+req.params.id);
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
      const params = Object.assign(req.body, { eventId: req.params.eventId });
      const result = parseCreateAddonRequest(params);
      if (!result.success) return res.sendStatus(400);
      await controller.createAddon(params);
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
      await controller.deleteAddon(+req.params.eventId, +req.params.addonId);
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
    const params = Object.assign(req.body, {
      eventId: req.params.eventId,
      addonId: req.params.addonId,
    });

    const result = parseUpdateAddonRequest(params);
    if (!result.success) return res.sendStatus(400);

    try {
      await controller.updateAddon(result.value);
      return res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
