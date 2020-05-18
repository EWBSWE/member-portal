import * as express from "express"
import * as auth from "../auth/auth.service"
import { me, allUsers } from "./UserController"

const router = express.Router()

router.get("/me", auth.isAuthenticated(), async (req, res, next) => {
    // todo: Update Request interface
    //@ts-ignore
    const response = await me(req.user.id)
    return res.status(200).json(response)
})

router.get("/", auth.isAuthenticated(), async (req, res, next) => {
    const response = await allUsers()
    return res.status(200).json(response)
})

export default router
