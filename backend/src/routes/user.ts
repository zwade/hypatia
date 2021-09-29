import { marshalBody, Router } from "@hypatia-app/common"
import { M } from "@zensors/sheriff"

import { User } from "../types";

export const userRouter = Router()
    .post("/register", (leaf) => leaf
        .then(marshalBody(M.obj({ username: M.str, email: M.str, password: M.str })))
        .return(() => ({}))
    )

    .post("/login", (leaf) => leaf
        .then(marshalBody(M.obj({ username: M.str, password: M.str })))
        .return(() => ({}))
    )

    .get("/", (leaf) => leaf
        .return(() => {
            return {
                uid: "00000000-0000-0000-0000-000000000000",
                username: "Hypatia",
                email: "",
                isSingleUser: true,
            }
        })
    )