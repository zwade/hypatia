import * as React from "react";
import type { Module } from "@hypatia-app/backend/dist/client";
import { Loadable } from "@hypatia-app/common";

import { API } from "../api";
import { TheGreatLie } from "react-pwn";

export const ModuleContext = React.createContext<{ data: Loadable<Module.AsWire[]>, reload: () => void }>(TheGreatLie());

export const ModuleProvider = (props: { children: React.ReactNode }) => {
    const [module, setModule] = React.useState<Loadable<Module.AsWire[]>>(API.Modules.modules());

    React.useEffect(() => {
        if (module.kind !== "loading") return;
        module.then(setModule);
    }, []);

    const reload = async () => {
        console.log("reloading");
        if (module.kind !== "value") return
        const reloading = module.reload();
        setModule(reloading);
        setModule(await reloading);
    }

    return (
        <ModuleContext.Provider value={{ data: module, reload }}>
            {props.children}
        </ModuleContext.Provider>
    );
}