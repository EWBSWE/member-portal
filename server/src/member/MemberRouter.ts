import * as express from "express";
import * as auth from "../auth/auth.service";

const legacyController2 = require("../api/member/MemberController");

import RouteBuilder = require("../RouteBuilder");
import { MemberController } from "./MemberController";
import { parseShowMemberParams } from "./ShowMemberRequest";
import { MemberRepository } from "./MemberRepository";
import { SqlProvider } from "../SqlProvider";
import { db } from "../db";
import { createHandlerNoInput, createHandler } from "../createHandler";
import { ChapterRepository } from "./ChapterRepository";
import { parseCreateMemberRequest } from "./CreateMemberRequest";
import { parseBulkCreateParams } from "./BulkCreateRequest";
import { parseUpdateMemberParams } from "./UpdateMemberRequest";

const memberRepository = new MemberRepository(db, SqlProvider);
const chapterRepository = new ChapterRepository(db, SqlProvider);
const controller = new MemberController(memberRepository, chapterRepository);
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
  new RouteBuilder(legacyController2.createMemberFromPurchase)
    .requiredParams(["productId", "stripeToken"])
    .build()
);

export default router;
