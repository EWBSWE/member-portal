import * as express from "express";
import { createHandlerNoInput } from "../createHandler";
import { db } from "../db";
import { ProductRepository } from "../product/ProductRepository";
import { SqlProvider } from "../SqlProvider";
import { ProductController } from "./ProductController";
import { MemberRepository } from "../member/MemberRepository";

const productRepository = new ProductRepository(db, SqlProvider);
const memberRepository = new MemberRepository(db, SqlProvider);

const controller = new ProductController(productRepository, memberRepository);

const router = express.Router();

router.get(
  "/membership",
  createHandlerNoInput(controller.memberships.bind(controller))
);

export default router;
