import { Router, static as expressStatic } from "express";
import * as fs from "fs-extra";
import * as path from "path";

export const baseRouter = Router();

const dist = path.dirname(require.resolve("@hypatia-app/client"));

baseRouter.use("/assets/", expressStatic(dist));

baseRouter.use("/", (req, res, next) => {
    if (req.method !== "GET") {
        return next();
    }

    res.sendFile(path.join(dist, "index.html"));
})
