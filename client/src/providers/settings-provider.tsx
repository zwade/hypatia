import * as React from "react";
import { useLocalStorage, usePage } from "../hooks";

export type SettingsType<T> =
    T extends boolean ? "boolean" :
    never;

export type SettingsDescription<K, T> =
    undefined extends T
        ? {
            name: K;
            description?: string;
            nullable: true;
            type: SettingsType<T>;
        }
        : {
            name: K;
            description?: string;
            nullable: false;
            default: T;
            type: SettingsType<T>;
        }

export type SettingsDescriptions<T extends Record<string, any>> =
    NonNullable<{ [K in keyof T]: SettingsDescription<K, T[K]> }[keyof T]>[]

export interface GlobalSettings {
    vertical: boolean;
}

export interface ModuleSettings {
    autoRun?: boolean;
}

export interface LessonSettings {

}

export interface PageSettings {
    autoRun?: boolean;
}

export interface Settings {
    global: GlobalSettings;
    module?: ModuleSettings;
    lesson?: LessonSettings;
    page?: PageSettings;
}

export interface PartialSettings {
    global?: Partial<GlobalSettings>;
    module?: Partial<ModuleSettings>;
    lesson?: Partial<LessonSettings>;
    page?: Partial<PageSettings>;
}

export type Description = {
    global: SettingsDescriptions<GlobalSettings>;
    module: SettingsDescriptions<ModuleSettings>;
    lesson: SettingsDescriptions<LessonSettings>;
    page: SettingsDescriptions<PageSettings>;
}

export const description: Description = {
    global: [
        {
            name: "vertical",
            description: "Terminal Orientation",
            nullable: false,
            default: false,
            type: "boolean"
        }
    ],
    module: [
        {
            name: "autoRun",
            description: "Allow Code to Run on Load",
            nullable: true,
            type: "boolean",
        }
    ],
    lesson: [],
    page: [
        {
            name: "autoRun",
            description: "Allow Code to Run on Load",
            nullable: true,
            type: "boolean",
        }
    ]
}

export interface SettingsContextData {
    settings: Settings;
    setSettings: (settings: PartialSettings) => void;
}

export const SettingsContext = React.createContext<SettingsContextData>({
    settings: {
        global: {
            vertical: false
        },
    },

    setSettings: () => {},
});

export interface Props {
    children: React.ReactNode;
}

export const SettingsProvider = (props: Props) => {
    const page = usePage() ?? { module: "none", lesson: "none", page: -1 };

    const globalKey = "settings";
    const moduleKey = `settings-module-${page.module}`;
    const lessonKey = `settings-lesson-${page.module}/${page.lesson}`;
    const pageKey   = `settings-page-${page.module}/${page.lesson}/${page.page}`;

    const [globalSettings, _, mergeGlobalSettings] = useLocalStorage<GlobalSettings>(
        globalKey,
        {
            vertical: false,
        }
    );

    const [moduleSettings, _setModuleSettings, mergeModuleSettings] = useLocalStorage<ModuleSettings>(moduleKey, {});
    const [lessonSettings, _setLessonSettings, mergeLessonSettings] = useLocalStorage<LessonSettings>(lessonKey, {});
    const [pageSettings, _setPageSettings, mergePageSettings] = useLocalStorage<PageSettings>(pageKey, {});

    const settings: Settings = {
        global: globalSettings,
    }

    if (page) {
        settings.module = moduleSettings;
        settings.lesson = lessonSettings;
        settings.page = pageSettings;
    }

    const setSettings = (partialSettings: PartialSettings) => {
        mergeGlobalSettings(partialSettings.global ?? {});

        if (page) {
            mergeModuleSettings(partialSettings.module ?? {});
            mergeLessonSettings(partialSettings.lesson ?? {});
            mergePageSettings(partialSettings.page ?? {});
        }
    }

    return (
        <SettingsContext.Provider value={{ settings, setSettings }}>
            { props.children }
        </SettingsContext.Provider>
    )
}