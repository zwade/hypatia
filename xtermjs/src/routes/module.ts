import { M, marshal } from "@zensors/sheriff";
import { Router } from "express";
import * as fs from "fs-extra";
import * as path from "path";

export const moduleRouter = Router();

const allowedLessons =
    new Set(
        (process.env.MODULE ?? "").split(/,\s+/)
    );

type Modules = {
    [module: string]: {
        [lesson: string]: number;
    }
}

const baseDir = path.join(__dirname, "../../../lessons");

const getPages = async (module: string, lesson: string) => {
    const lessonBaseDir = path.join(baseDir, module, lesson);
    const files = await fs.readdir(lessonBaseDir);
    const pages = files
        .filter((f) => !f.startsWith("."))
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

moduleRouter.get("/", async (req, res) => {
    const modules = await getAll();
    res.json(modules);
});

moduleRouter.get("/:module/:lesson/:page.md", async (req, res) => {
    const pages = await getPages(req.params.module, req.params.lesson);
    const pageNo = parseInt(req.params.page, 10);
    const page = pages[pageNo];

    const data = await fs.readFile(page, "utf-8");
    res.type("text/markdown").send(data);
});