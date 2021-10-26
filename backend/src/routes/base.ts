import { NextFunction, Response, static as expressStatic } from "express";
import { Router, UnknownRequest } from "@hypatia-app/common";
import * as path from "path";

const dist = path.dirname(require.resolve("@hypatia-app/client"));

process.env.isSingle ??= "true";

export const baseRouter = Router()
    .use("/assets/", expressStatic(dist))
    .use("/env.js", (req: UnknownRequest, res: Response) => {
        const env = {
            isSingle: process.env.isSingle ?? "false",
        }

        res.send(`
const _serializedSettings = ${JSON.stringify(env)}

window.process = window.process || {};
window.process.env = window.process.env || {};
window.process.env = Object.assign(window.process.env, _serializedSettings);
        `);
    })
    .use("/", (req: UnknownRequest, res: Response, next: NextFunction) => {
        if (req.method !== "GET") {
            return next();
        }

        res.sendFile(path.join(dist, "index.html"));
    });
