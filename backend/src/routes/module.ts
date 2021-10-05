import { marshalParams, Router } from "@hypatia-app/common";
import { M } from "@zensors/sheriff";
import * as fs from "fs-extra";
import * as path from "path";
import { getPageData, getAllModuleCaches, baseDir, getPageFile } from "../modules";

const allowedAssets = new Set(["jpg", "jpeg", "png", "gif", "svg"]);

export const moduleRouter = Router()
    .get("/", (leaf) => leaf
        .return(() => getAllModuleCaches())
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
                const file = path.join(baseDir, req.params.module, req.params.lesson, "assets", req.params.file);
                res.type(extension).sendFile(file);
            } else {
                res.status(404).end();
            }
        })
    )