import * as yaml from "yaml";
import * as fs from "fs-extra";
import * as path from "path";
import { marshal, MarshalError, Marshaller } from "@zensors/sheriff";
import { SafeError } from "@hypatia-app/common";

import { Lesson, Module, Page, View } from "../types";
import { Options } from "../options"


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

const readPage = async (fileName: string) => {
    let data: string;
    try {
        data = await fs.readFile(fileName, "utf8");
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
        const frontMatter = data.slice(firstSeparator.index! + firstSeparator[0].length, secondSeparator.index);
        config = parseConfig(frontMatter, Page.MAsInline);
        pageData = data.slice(secondSeparator.index! + secondSeparator[0].length);
    } else {
        config = {
            additionalView: {
                kind: "terminal",
                connection: "default-shell"
            }
        };
        pageData = data;
    }

    return [config, pageData] as const;
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
            if (e instanceof MarshalError) {
                console.warn(`Found invalid configuration: ${path.join(pathName, fileName)}`);
                console.warn(e.toString());
            }
        }
    }
}

export const getPageFile = async (module: string, lesson: string, fileName: string) => {
    const fullName = path.join(Options.moduleDir, module, lesson, fileName);
    const [_config, pageData] = await readPage(fullName);
    return pageData;
}

export const getPageData = async (module: string, lesson: string, page: string) => {
    const pageAsNumber = parseInt(page, 10);
    const lessonConfig = await getConfig(path.join(Options.moduleDir, module, lesson), Lesson.MAsInline);

    const pages = lessonConfig?.pages ?? await listPages(path.join(Options.moduleDir, module, lesson));
    const fileName = path.join(Options.moduleDir, module, lesson, pages[pageAsNumber]);

    const [config, _pageData] = await readPage(fileName);
    const baseView: View.t = { kind: "markdown", fileName: pages[pageAsNumber] };
    const completeConfig: Page.AsWire = {
        name: config.name ?? page,
        path: pageAsNumber.toString(),
        view:
            !config.additionalView ? baseView :
            [baseView, config.additionalView]
    }

    return completeConfig
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

    const hasDefaultShell = (config?.services ?? [])
        .some((service) =>
            service.connections?.some((port) => port.name === "default-shell") ?? false
        );
    const baseServices = config?.services ?? [];
    const services =
        hasDefaultShell ? baseServices :
        baseServices.concat([{
            kind: "command",
            command: "bash",
            name: "default-service",
            connections: [{ kind: "pty", name: "default-shell" }]
        }]);


    const data: Module.AsWire = {
        name: config?.name ?? name,
        path: name,
        lessons: lessonCache.filter(({ pages }) => pages.length > 0),
        services,
    }

    return data;
}

export const getModuleByPath = (modulePath: string) => {
    return getModuleCache(modulePath, path.join(Options.moduleDir, modulePath));
}

export const getAllModuleCaches = async () => {
    const files = await fs.readdir(Options.moduleDir);
    const stats = await Promise.all(files.map((f) => fs.stat(path.join(Options.moduleDir, f))));
    const directories = files
        .filter((f, i) => !f.startsWith(".") && stats[i].isDirectory());

    const modules = await Promise.all(directories.map((d) => getModuleCache(d, path.join(Options.moduleDir, d))));

    const enabledModules = new Set(Options.enabledModules);
    const bundles = modules.filter((m) => m.lessons.length > 0 && (enabledModules.has(m.name) || enabledModules.has("ALL")));

    return (
        bundles.map((bundle) => ({
            bundle,
            public: true,
            disabled: false,
            owner: "",
        }))
    );
}