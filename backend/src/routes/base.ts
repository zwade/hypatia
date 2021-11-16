import { NextFunction, Response, static as expressStatic } from "express";
import { Router, SafeError, UnknownRequest } from "@hypatia-app/common";
import * as path from "path";

import { get3LD } from "../net-utils";

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
    .use("/quest", (req: UnknownRequest, res: Response) => {
        const domain = get3LD(req);
        if (domain === null || domain[0] !== "sandbox") {
            res.status(404).end();
        } else {
            res.sendFile(path.join(dist, "quest/index.html"))
        }
    })
    .use("/", (req: UnknownRequest, res: Response, next: NextFunction) => {
        if (req.method !== "GET") {
            return next();
        }

        res.sendFile(path.join(dist, "index.html"));
    });
