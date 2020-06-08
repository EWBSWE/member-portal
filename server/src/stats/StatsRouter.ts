import * as express from "express";
import * as auth from "../auth/auth.service";

import { SqlProvider } from "../SqlProvider";
import { db } from "../db";
import { createHandlerNoInput } from "../createHandler";
import { StatsController } from "./StatsController";
import { MemberRepository } from "../member/MemberRepository";

const memberRepository = new MemberRepository(db, SqlProvider);
const controller = new StatsController(memberRepository);

const router = express.Router();

router.get(
  "/members",
  auth.isAuthenticated(),
  createHandlerNoInput(controller.members.bind(controller))
);

export default router;
