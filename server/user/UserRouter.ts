import * as express from "express"
import * as auth from "../auth/auth.service"
import { UserController } from "./UserController"
import { PgUserStore } from "./PgUserStore"
import { UserRepository } from "./UserRepository"
import { SqlProvider } from "../SqlProvider"
import * as logger from "../config/logger"

const router = express.Router()

const userStore = new PgUserStore(SqlProvider)
const userRepository = new UserRepository(userStore)
const controller = new UserController(userRepository)

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
