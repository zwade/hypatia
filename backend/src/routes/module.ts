import { marshalBody, marshalParams, marshalQuery, Router, SafeError } from "@hypatia-app/common";
import { M, marshal } from "@zensors/sheriff";
import * as path from "path";
import * as fs from "fs-extra";
import * as yaml from "yaml";

import { getPageData, getAllModuleCaches, getPageFile } from "../modules/utils";
import { Module } from "../types";
import { Options } from "../options";
import { Quest } from "../types/quest";

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

    .get("/:module/:lesson/signed-asset/:file", (leaf) => leaf
        .then(marshalParams(M.obj({ module: M.str, lesson: M.str, file: M.str })))
        .return(() => {
            return "file-signature";
        })
    )

    .post("/:module/:lesson/signed-asset/:file", (leaf) => leaf
        .then(marshalParams(M.obj({ module: M.str, lesson: M.str, file: M.str })))
        .then(marshalBody(M.obj({ signature: M.str, kind: M.lit("quest") })))
        .return(async (req) => {
            // This should be cryptographic in a real server
            const signature = req.body.signature;
            if (signature !== "file-signature") {
                throw new SafeError(404, "Not found");
            }

            const file = path.join(Options.moduleDir, req.params.module, req.params.lesson, "assets", req.params.file);
            console.log(file);
            const data = await fs.readFile(file);

            // Normally this would be done on load, but hypatia standalone is lazy
            switch (req.body.kind) {
                case "quest": {
                    const yamlData = data.toString();
                    const asJson = yaml.parse(yamlData);
                    marshal(asJson, Quest.MQuest);
                    return asJson;
                }
                default: {
                    throw new SafeError(404, "Not found");
                }
            }
        })
    )