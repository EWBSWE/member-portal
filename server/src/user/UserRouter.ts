import * as express from "express";
import * as auth from "../auth/auth.service";
import { UserController } from "./UserController";
import { PgUserStore } from "./PgUserStore";
import { UserRepository } from "./UserRepository";
import { UserFactory } from "./UserFactory";
import { SqlProvider } from "../SqlProvider";
import * as logger from "../config/logger";
import { OutgoingMessageRepository } from "../outgoing-message/OutgoingMessageRepository";
import { OutgoingMessageFactory } from "../outgoing-message/OutgoingMessageFactory";
import { db } from "../db";

const router = express.Router();

const userFactory = new UserFactory();
const userStore = new PgUserStore(db, SqlProvider);
const userRepository = new UserRepository(userStore);

const noReply = process.env.NO_REPLY;
const appUrl = process.env.APP_URL;
const messageFactory = new OutgoingMessageFactory(noReply!, appUrl!);

const messageRepository = new OutgoingMessageRepository(db, SqlProvider);

const controller = new UserController(
  userFactory,
  userRepository,
  messageRepository,
  messageFactory
);

router.get("/me", auth.isAuthenticated(), async (req, res, next) => {
  // todo: Update Request interface
  //@ts-ignore
  const response = await controller.me(req.user.id);
  return res.status(200).json(response);
});

router.get("/", auth.isAuthenticated(), async (req, res, next) => {
  const response = await controller.allUsers();
  return res.status(200).json(response);
});

router.post("/", auth.isAuthenticated(), async (req, res, next) => {
  try {
    const response = await controller.createUser(req.body.email);
    return res.status(200).json(response);
  } catch (e) {
    logger.error(e);
    return res.sendStatus(400);
  }
});

router.delete("/:id", auth.isAuthenticated(), async (req, res, next) => {
  try {
    // todo: Update Request interface
    //@ts-ignore
    const response = await controller.removeUser(req.user.id, req.params.id);
    return res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    return res.sendStatus(400);
  }
});

router.put("/:id", auth.isAuthenticated(), async (req, res, next) => {
  const currentPassword = req.body.password;
  const newPassword = req.body.newPassword;
  if (!currentPassword || !newPassword) return res.sendStatus(400);
  try {
    const response = await controller.changePassword(
      //@ts-ignore
      req.params.id,
      currentPassword,
      newPassword
    );
    return res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    return res.sendStatus(400);
  }
});

router.post("/reset-password", async (req, res, next) => {
  const email = req.body.email;
  if (!email) return res.sendStatus(400);
  try {
    const response = await controller.resetPassword(email);
    return res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    return res.sendStatus(400);
  }
});

router.post("/reset-password-token", async (req, res, next) => {
  const token = req.body.token;
  const newPassword = req.body.newPassword;
  if (!token || !newPassword) return res.sendStatus(400);
  try {
    logger.debug(`Setting new password`);
    await controller.setPassword(token, newPassword);
    return res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    return res.sendStatus(400);
  }
});

export default router;
