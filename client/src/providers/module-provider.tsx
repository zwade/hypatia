import * as React from "react";
import { API } from "../api/lessons";

export type ModuleData = Map<string, Map<string, number>>;

export const ModuleContext = React.createContext<{ data?: ModuleData, reload: () => void }>({
    data: undefined,
    reload: () => {},
});

export const ModuleProvider = (props: { children: React.ReactNode }) => {
    const [module, setModule] = React.useState<ModuleData>(new Map());

    const reload = async () => {
        const data = await API.Modules.modules();
        const mapData: ModuleData = new Map();

        for (const module of Object.keys(data)) {
            const lessons: Map<string, number> = new Map();

            for (const lesson of Object.keys(data[module])) {
                lessons.set(lesson, data[module][lesson]);
            }

            mapData.set(module, lessons);
        }

        setModule(mapData);
    }

    React.useEffect(() => {
        reload();
    }, []);

    return (
        <ModuleContext.Provider value={{ data: module, reload }}>
            {props.children}
        </ModuleContext.Provider>
    );
}