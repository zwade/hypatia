import * as AdmZip from "adm-zip";
import * as fs from "fs-extra";
import * as crypto from "crypto";
import * as path from "path";

import { getPageData, getPageFile, getModuleByPath } from "./utils";
import { Module, Lesson, Page, View } from "../types";
import { Options } from "../options";

export const getFileName = (contents: string | Buffer, suffix?: string) => {
    const hash = crypto.createHash("sha256");
    hash.update(contents);
    return `${hash.digest("hex")}${suffix ? "." + suffix : ""}`;
}

/**
 * Assets are named according to path so that they can still be referenced in the markdown by name.
 */
export const getAssetName = (module: string, lesson: string, asset: string) => {
    const hash = crypto.createHash("sha256");
    hash.update(`${module}\x00${lesson}\x00${asset}`);
    // Assets don't get to keep their extensions.
    // They should always be served as binary data.
    // TODO(zwade): Figure out if chrome is ok with that
    return hash.digest("hex");
}

const bundleView = async (module: string, lesson: string, page: string, view: View.t, zip: AdmZip): Promise<View.t> => {
    if (Array.isArray(view)) {
        const left = await bundleView(module, lesson, page, view[0], zip);
        const right = await bundleView(module, lesson, page, view[1], zip);
        return [left, right];
    }

    switch (view.kind) {
        case "http":
        case "terminal": {
            return view;
        }
        case "markdown": {
            const pageFile = await getPageFile(module, lesson, view.fileName);
            const fileName = getFileName(pageFile, "md");

            zip.addFile(fileName, Buffer.from(pageFile, "utf-8"));
            return {
                ...view,
                fileName,
            }
        }
        case "quest": {
            const filePath = path.join(Options.moduleDir, module, lesson, "assets", view.file);
            const file = await fs.readFile(filePath);
            const fileName = getAssetName(module, lesson, view.file);

            zip.addFile(fileName, file);
            return {
                ...view,
                file: fileName,
            }
        }
    }
}

const bundlePage = async (module: string, lesson: string, page: string, zip: AdmZip) => {
    const pageData = await getPageData(module, lesson, page);

    const pageBundle: Page.AsBundle = {
        ...pageData,
        view: await bundleView(module, lesson, page, pageData.view, zip),
        options: {
            requiresQuiz: pageData.options?.requiresQuiz ?? false,
        }
    }

    return pageBundle;
}

const bundleLesson = async (module: string, lesson: Lesson.AsWire, zip: AdmZip) => {
    const pageBundles = lesson.pages
        .map(async ({ path }) => await bundlePage(module, lesson.path, path, zip))
    const pages = await Promise.all(pageBundles);

    const assetDir = path.join(Options.moduleDir, module, lesson.path, "assets");

    const assetDirExists = await fs.pathExists(assetDir);
    if (assetDirExists) {
        const assets = await fs.readdir(assetDir, { withFileTypes: true });
        for (const asset of assets) {
            if (asset.isFile()) {
                const filePath = path.join(assetDir, asset.name);
                const file = await fs.readFile(filePath);
                const fileName = getAssetName(module, lesson.path, asset.name);

                zip.addFile(fileName, file);
            }
        }
    }

    const lessonBundle: Lesson.AsBundle = {
        ...lesson,
        pages
    }

    return lessonBundle;
}

const generateBundle = async (modulePath: string) => {
    const moduleAsWire = await getModuleByPath(modulePath);
    const zip = new AdmZip();

    const lessonBundles =
        moduleAsWire.lessons
            .map(async (lesson) => await bundleLesson(moduleAsWire.path, lesson, zip));
    const lessons = await Promise.all(lessonBundles);

    const moduleBundle: Module.AsBundle = {
        ...moduleAsWire,
        bundleVersion: 1,
        lessons,
    };

    const bundleConfig = Buffer.from(JSON.stringify(moduleBundle), "utf-8");

    zip.addFile("bundle.json", bundleConfig);
    return zip;
}

export const bundle = async (modulePath: string, outputPath: string) => {
    const zip = await generateBundle(modulePath);
    zip.writeZip(outputPath);
}