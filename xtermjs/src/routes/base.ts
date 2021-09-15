import { Router, static as expressStatic } from "express";
import * as fs from "fs-extra";
import * as path from "path";

export const baseRouter = Router();

const dist = path.join(__dirname, "../../../client/dist");

baseRouter.use("/assets/", expressStatic(dist));

baseRouter.use("/", (req, res, next) => {
    if (req.method !== "GET") {
        return next();
    }

    res.sendFile(path.join(dist, "index.html"));
})
