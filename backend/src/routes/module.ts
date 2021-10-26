import { marshalBody, marshalParams, marshalQuery, Router } from "@hypatia-app/common";
import { M } from "@zensors/sheriff";
import * as path from "path";

import { getPageData, getAllModuleCaches, getPageFile } from "../modules";
import { Module } from "../types";
import { Options } from "../options";

const allowedAssets = new Set(["jpg", "jpeg", "png", "gif", "svg"]);

export const moduleRouter = Router()
    .get("/", (leaf) => leaf
        .return(() => getAllModuleCaches())
    )

    .post("/", (leaf) => leaf
        .return((req) => {
            return true;
        })
    )

    .post("/q/subscription", (leaf) => leaf
        .then(marshalBody(M.obj({ module: M.str })))
        .return((req) => {
            return true;
        })
    )

    .get("/q/mine", (leaf) => leaf
        .return(() => {
            return [] as Module.WithSettings[];
        })
    )

    .get("/q/shared", (leaf) => leaf
        .return(() => {
            return [] as Module.WithSettings[];
        })
    )

    .get("/q/public", (leaf) => leaf
        .return(() => {
            return [] as Module.WithSettings[];
        })
    )

    .post("/:module", (leaf) => leaf
        .then(marshalParams(M.obj({ module: M.str })))
        .then(marshalBody(M.obj({ public: M.opt(M.bool), disabled: M.opt(M.bool) })))
        .return((req) => {
            return true;
        })
    )

    .get("/:module/:lesson/:page/data", (leaf) => leaf
        .then(marshalParams(M.obj({ module: M.str, lesson: M.str, page: M.str })))
        .return((req) => getPageData(req.params.module, req.params.lesson, req.params.page))
    )

    .get("/:module/:lesson/:filename/file", (leaf) => leaf
        .then(marshalParams(M.obj({ module: M.str, lesson: M.str, filename: M.str })))
        .return((req) => getPageFile(req.params.module, req.params.lesson, req.params.filename))
    )

    .get("/:module/:lesson/assets/:file", (leaf) => leaf
        .then(marshalParams(M.obj({ module: M.str, lesson: M.str, file: M.str })))
        .finish(async (req, res) => {
            const extension = path.extname(req.params.file).slice(1).toLocaleLowerCase();
            if (allowedAssets.has(extension)) {
                const file = path.join(Options.moduleDir, req.params.module, req.params.lesson, "assets", req.params.file);
                res.type(extension).sendFile(file);
            } else {
                res.status(404).end();
            }
        })
    )