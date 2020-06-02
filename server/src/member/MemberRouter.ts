import * as express from "express";
import * as auth from "../auth/auth.service";

const legacyController1 = require("../api/member/member.controller");
const legacyController2 = require("../api/member/MemberController");

import RouteBuilder = require("../RouteBuilder");
import { MemberController } from "./MemberController";
import { MemberRepository } from "./MemberRepository";
import { SqlProvider } from "../SqlProvider";
import { db } from "../db";
import { createHandlerNoInput } from "../createHandler";

const memberRepository = new MemberRepository(db, SqlProvider);
const controller = new MemberController(memberRepository);
const router = express.Router();

router.get(
  "/",
  auth.isAuthenticated(),
  createHandlerNoInput(controller.all.bind(controller))
);

router.get(
  "/chapters",
  new RouteBuilder(legacyController2.getChapters).build()
);
router.get("/:id", auth.isAuthenticated(), legacyController1.get);

router.post("/", auth.isAuthenticated(), legacyController1.create);

//router.post('/bulk', auth.isAuthenticated(), controller.bulkCreate);
router.post(
  "/bulk",
  auth.isAuthenticated(),
  new RouteBuilder(legacyController2.bulk).requiredParams(["members"]).build()
);

router.put(
  "/:id",
  auth.isAuthenticated(),
  new RouteBuilder(legacyController2.update).build()
);

router.delete("/:id", auth.isAuthenticated(), legacyController1.destroy);

router.post(
  "/membership",
  new RouteBuilder(legacyController2.createMemberFromPurchase)
    .requiredParams(["productId", "stripeToken"])
    .build()
);

export default router;
