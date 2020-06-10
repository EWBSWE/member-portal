import * as express from "express";
import * as auth from "../auth/auth.service";

import { MemberController } from "./MemberController";
import { parseShowMemberParams } from "./ShowMemberRequest";
import { MemberRepository } from "./MemberRepository";
import { SqlProvider } from "../SqlProvider";
import { db } from "../Db";
import { createHandlerNoInput, createHandler } from "../createHandler";
import { ChapterRepository } from "./ChapterRepository";
import { parseCreateMemberRequest } from "./CreateMemberRequest";
import { parseBulkCreateParams } from "./BulkCreateRequest";
import { parseUpdateMemberParams } from "./UpdateMemberRequest";
import { parseConfirmMembershipParams } from "./ConfirmMembershipRequest";
import { ProductRepository } from "../product/ProductRepository";
import { OutgoingMessageFactory } from "../outgoing-message/OutgoingMessageFactory";
import { OutgoingMessageRepository } from "../outgoing-message/OutgoingMessageRepository";

const memberRepository = new MemberRepository(db, SqlProvider);
const chapterRepository = new ChapterRepository(db, SqlProvider);
const productRepository = new ProductRepository(db, SqlProvider);
const noReply = process.env.NO_REPLY;
const appUrl = process.env.APP_URL;
const outgoingMessageFactory = new OutgoingMessageFactory(noReply!, appUrl!);
const outgoingMessageRepository = new OutgoingMessageRepository(
  db,
  SqlProvider
);

const controller = new MemberController(
  memberRepository,
  chapterRepository,
  productRepository,
  outgoingMessageFactory,
  outgoingMessageRepository
);
const router = express.Router();

router.get(
  "/",
  auth.isAuthenticated(),
  createHandlerNoInput(controller.all.bind(controller))
);

router.get(
  "/chapters",
  createHandlerNoInput(controller.chapters.bind(controller))
);

router.get("/types", createHandlerNoInput(controller.types.bind(controller)));

router.get(
  "/:id",
  auth.isAuthenticated(),
  createHandler(
    (req: express.Request) => ({ id: req.params.id }),
    parseShowMemberParams,
    controller.show.bind(controller)
  )
);

router.post(
  "/",
  auth.isAuthenticated(),
  createHandler(
    (req: express.Request) => req.body,
    parseCreateMemberRequest,
    controller.create.bind(controller)
  )
);

router.post(
  "/bulk",
  auth.isAuthenticated(),
  createHandler(
    (req: express.Request) => req.body,
    parseBulkCreateParams,
    controller.bulkCreate.bind(controller)
  )
);

router.put(
  "/:id",
  auth.isAuthenticated(),
  createHandler(
    (req: express.Request) => Object.assign(req.body, { id: req.params.id }),
    parseUpdateMemberParams,
    controller.update.bind(controller)
  )
);

router.post(
  "/membership",
  createHandler(
    (req: express.Request) => req.body,
    parseConfirmMembershipParams,
    controller.confirmMembership.bind(controller)
  )
);

export default router;
