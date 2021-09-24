import { NextFunction, Response, static as expressStatic } from "express";
import { Router, UnknownRequest } from "@hypatia-app/common";
import * as path from "path";

const dist = path.dirname(require.resolve("@hypatia-app/client"));

export const baseRouter = Router()
    .use("/assets/", expressStatic(dist))
    .use("/", (req: UnknownRequest, res: Response, next: NextFunction) => {
        if (req.method !== "GET") {
            return next();
        }

        res.sendFile(path.join(dist, "index.html"));
    });
