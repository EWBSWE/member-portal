import * as express from "express"
import * as auth from "../auth/auth.service"
import { UserController } from "./UserController"
import { PgUserStore } from "./PgUserStore"
import { UserRepository } from "./UserRepository"
import { UserFactory } from "./UserFactory"
import { SqlProvider } from "../SqlProvider"
import * as logger from "../config/logger"
import { OutgoingMessageRepository } from "../outgoing-message/OutgoingMessageRepository"
import { OutgoingMessageFactory } from "../outgoing-message/OutgoingMessageFactory"
import { PgOutgoingMessageStore } from "../outgoing-message/PgOutgoingMessageStore"
import { db } from "../db"

const router = express.Router()

const userFactory = new UserFactory()
const userStore = new PgUserStore(db, SqlProvider)
const userRepository = new UserRepository(userStore)

const noReply = process.env.NO_REPLY
const appUrl = process.env.APP_URL + "/login"
const messageFactory = new OutgoingMessageFactory(noReply!, appUrl)

const messageStore = new PgOutgoingMessageStore(db, SqlProvider)
const messageRepository = new OutgoingMessageRepository(messageStore)

const controller = new UserController(userFactory, userRepository, messageRepository, messageFactory)

router.get("/me", auth.isAuthenticated(), async (req, res, next) => {
    // todo: Update Request interface
    //@ts-ignore
    const response = await controller.me(req.user.id)
    return res.status(200).json(response)
})

router.get("/", auth.isAuthenticated(), async (req, res, next) => {
    const response = await controller.allUsers()
    return res.status(200).json(response)
})

router.post("/", auth.isAuthenticated(), async (req, res, next) => {
     try {
         const response = await controller.createUser(req.body.email)
         return res.status(200).json(response)
     } catch (e) {
         logger.error(e)
         return res.sendStatus(400)
     }
})

router.delete("/:id", auth.isAuthenticated(), async (req, res, next) => {
    try {
        // todo: Update Request interface
        //@ts-ignore
        const response = await controller.removeUser(req.user.id, req.params.id)
        return res.sendStatus(200)
    } catch (e) {
        logger.error(e)
        return res.sendStatus(400)
    }
})

export default router
