import { marshalBody, marshalParams, marshalQuery, Router } from "@hypatia-app/common"
import { M } from "@zensors/sheriff"

import { User } from "../types";

export const userRouter = Router()
    .post("/logout", (leaf) => leaf
        .return(() => ({}))
    )

    .post("/register", (leaf) => leaf
        .then(marshalBody(M.obj({ username: M.str, email: M.str, password: M.str })))
        .return(() => ({}))
    )

    .post("/login", (leaf) => leaf
        .then(marshalBody(M.obj({ username: M.str, password: M.str })))
        .return(() => ({}))
    )

    .get("/verify", (leaf) => leaf
        .then(marshalQuery(M.obj({ email: M.str, token: M.str })))
        .finish<void>((req, res) => {
            res.redirect("/");
        })
    )

    .post("/resend-verification", (leaf) => leaf
        .return((req) => {
            return true;
        })
    )

    .post("/request-reset-password", (leaf) => leaf
        .then(marshalBody(M.obj({ email: M.str })))
        .return((req) => {
            return true;
        })
    )

    .post("/reset-password", (leaf) => leaf
        .then(marshalBody(M.obj({ email: M.str, token: M.str, password: M.str })))
        .return((req) => {
            return true;
        })
    )

    .get("/", (leaf) => leaf
        .return(() => {
            return {
                uid: "00000000-0000-0000-0000-000000000000",
                username: "Hypatia",
                email: "",
                isVerified: true,
                isSingleUser: true,
            } as {
                uid: string;
                username: string;
                email: string;
                isVerified: boolean;
                isSingleUser?: boolean;
            }
        })
    )
