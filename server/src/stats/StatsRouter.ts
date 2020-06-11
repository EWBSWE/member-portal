import * as express from "express";

import { SqlProvider } from "../SqlProvider";
import { db } from "../Db";
import { createHandlerNoInput } from "../createHandler";
import { StatsController } from "./StatsController";
import { MemberRepository } from "../member/MemberRepository";
import { isAuthenticated } from "../auth/AuthService";

const memberRepository = new MemberRepository(db, SqlProvider);
const controller = new StatsController(memberRepository);

const router = express.Router();

router.get(
  "/members",
  isAuthenticated(),
  createHandlerNoInput(controller.members.bind(controller))
);

export default router;
