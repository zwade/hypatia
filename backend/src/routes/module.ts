import { marshalParams, Router } from "@hypatia-app/common";
import { M } from "@zensors/sheriff";
import * as fs from "fs-extra";
import * as path from "path";

const allowedLessons =
    new Set(
        (process.env.MODULE ?? "ALL").split(/,\s*/)
    );

type Modules = {
    [module: string]: {
        [lesson: string]: number;
    }
}

const allowedAssets = new Set(["jpg", "jpeg", "png", "gif"]);

const baseDir = path.join(process.cwd(), "modules");

const getPages = async (module: string, lesson: string) => {
    const lessonBaseDir = path.join(baseDir, module, lesson);
    const files = await fs.readdir(lessonBaseDir);
    const stats = await Promise.all(
        files.map((f) => fs.stat(path.join(lessonBaseDir, f)))
    );

    const pages = files
        .filter((f) => !f.startsWith("."))
        .filter((_, i) => stats[i].isFile())
        .map((f) => {
            const fileNameTest = f.match(/^(\d+).md$/);
            if (fileNameTest === null) {
                console.warn(`Found unexpected page: [${f}] in lesson [${lesson}].`)
            }
            const number = parseInt(fileNameTest?.[1] ?? "0", 10);

            return {
                number,
                path: path.join(lessonBaseDir, f),
            }
        })
        .sort(({ number: a }, { number: b }) => a - b);

    return pages
        .map(({ path }) => path);
}

const getLessons = async (module: string) => {
    const files = await fs.readdir(path.join(baseDir, module));
    return files
        .filter((f) => !f.startsWith("."))
        .map((f) => ({
            name: f,
            path: path.join(baseDir, module, f),
            module,
        }));
}

const getModules = async () => {
    const directories = await fs.readdir(baseDir);
    return directories
        .filter((d) => !d.startsWith("."))
        .map((d) => ({
            name: d,
            path: path.join(baseDir, d),
        }));
}

const getAll = async () => {
    const result: Modules = Object.create(null);
    const modules = await getModules();

    for (const module of modules) {
        if (!allowedLessons.has(module.name) && !allowedLessons.has("ALL")) {
            continue;
        }

        result[module.name] = Object.create(null);
        const lessons = await getLessons(module.name);

        for (const lesson of lessons) {
            const pages = await getPages(module.name, lesson.name);
            result[module.name][lesson.name] = pages.length;
        }
    }

    return result;
}

export const moduleRouter = Router()
    .get("/", (leaf) => leaf
        .return(() => getAll())
    )
    .get("/:module/:lesson/:page.md", (leaf) => leaf
        .then(marshalParams(M.obj({ module: M.str, lesson: M.str, page: M.str })))
        .return(async (req) => {
            const pages = await getPages(req.params.module, req.params.lesson);
            const pageNo = parseInt(req.params.page, 10);
            const page = pages[pageNo];

            const data = await fs.readFile(page, "utf-8");
            return data;
        })
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