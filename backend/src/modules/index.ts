import * as yaml from "yaml";
import * as fs from "fs-extra";
import * as path from "path";
import { marshal, Marshaller } from "@zensors/sheriff";

import { Lesson, Module, Page, View } from "../types";
import { SafeError } from "@hypatia-app/common";

type Modules = {
    [module: string]: {
        [lesson: string]: number;
    }
}

const allowedLessons =
    new Set(
        (process.env.MODULE ?? "ALL").split(/,\s*/)
    );


export const baseDir = path.join(process.cwd(), "modules");

const isConfig = (f: string) => f === "config.yml" || f === "config.yaml" || f === "config.json";
const parseConfig = <T>(data: string, m: Marshaller<T>): T => {
    const parsedData = yaml.parse(data);
    marshal(parsedData, m);
    return parsedData;
}
const readConfig = async <T>(f: string, m: Marshaller<T>): Promise<T> => {
    const data = await fs.readFile(f, "utf8");
    return parseConfig(data, m);
}

export const listPages = async (pathName: string) => {
    const files = await fs.readdir(pathName);
    const stats = await Promise.all(files.map((f) => fs.stat(path.join(pathName, f))));
    return files
        .filter((f, i) => !f.startsWith(".") && !isConfig(f) && stats[i].isFile())
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export const getConfig = async <T>(pathName: string, m: Marshaller<T>) => {
    for (const fileName of ["config.yaml", "config.yml", "config.json"]) {
        try {
            return await readConfig(path.join(pathName, fileName), m);
        } catch (e) {
            // pass
        }
    }
}

export const getPage = async (module: string, lesson: string, page: string) => {
    const pageAsNumber = parseInt(page, 10);
    const lessonConfig = await getConfig(path.join(baseDir, module, lesson), Lesson.MAsInline);

    const pages = lessonConfig?.pages ?? await listPages(path.join(baseDir, module, lesson));

    let data: string;
    try {
        data = await fs.readFile(path.join(baseDir, module, lesson, pages[pageAsNumber]), "utf8");
    } catch (e) {
        throw new SafeError(404, "Page not found");
    }

    let config: Page.AsInline;
    let pageData: string;
    const separators = [...data.matchAll(/(^|\n)---+\n/g)];
    const hasFrontMatter = data.match(/^---+\n/) !== null && separators.length >= 2;

    if (hasFrontMatter) {
        const firstSeparator = separators[0];
        const secondSeparator = separators[1];
        const frontMatter = data.slice(firstSeparator.index ?? 0 + firstSeparator[0].length, secondSeparator.index);
        config = parseConfig(frontMatter, Page.MAsInline);
        pageData = data.slice(secondSeparator.index ?? 0 + secondSeparator[0].length);
    } else {
        config = {
            additionalView: {
                kind: "terminal",
                command: {
                    kind: "command",
                    command: "bash"
                }
            }
        };
        pageData = data;
    }

    const baseView: View.t = { kind: "markdown", fileName: `/${module}/${lesson}/${page}` };
    const completeConfig: Page.AsWire = {
        name: config.name ?? page,
        path: pageAsNumber.toString(),
        view:
            !config.additionalView ? baseView :
            [baseView, config.additionalView]
    }

    return [completeConfig, pageData] as const;
}

const getLessonCache = async (name: string, pathName: string) => {
    const pages = await listPages(pathName);
    const config = await getConfig(pathName, Lesson.MAsInline);
    const pageNames = config?.pages ?? pages;
    const pageNamesSanitized = pageNames
        .map((_, i) => ({ path: i.toString() }));

    const data: Lesson.AsWire = {
        name: config?.name ?? name,
        path: name,
        pages: pageNamesSanitized,
    }
    return data;
}

const getModuleCache = async (name: string, pathName: string) => {
    const files = await fs.readdir(pathName);
    const stats = await Promise.all(files.map((f) => fs.stat(path.join(pathName, f))));
    const directories = files.filter((f, i) => !f.startsWith(".") && stats[i].isDirectory());

    const config = await getConfig(pathName, Module.MAsInline);
    const lessonDirectories = config?.lessons ?? directories;
    const lessonCache = await Promise.all(lessonDirectories.map((name) => getLessonCache(name, path.join(pathName, name))));

    const data: Module.AsWire = {
        name: config?.name ?? name,
        path: name,
        lessons: lessonCache.filter(({ pages }) => pages.length > 0),
    }

    return data;
}

export const getAllModuleCaches = async () => {
    const files = await fs.readdir(baseDir);
    const stats = await Promise.all(files.map((f) => fs.stat(path.join(baseDir, f))));
    const directories = files
        .filter((f, i) => !f.startsWith(".") && stats[i].isDirectory());

    const modules = await Promise.all(directories.map((d) => getModuleCache(d, path.join(baseDir, d))));

    return modules.filter((m) => m.lessons.length > 0 && (allowedLessons.has(m.name) || allowedLessons.has("ALL")));
}