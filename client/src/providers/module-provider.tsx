import * as React from "react";
import type { Module } from "@hypatia-app/backend/dist/client";
import { Loadable } from "@hypatia-app/common";

import { API } from "../api";
import { TheGreatLie } from "react-pwn";
import { useLoadable } from "../hooks";

export const ModuleContext = React.createContext<{
    subscriptions: Loadable<Module.WithSettings[]>,
    mine: Loadable<Module.WithSettings[]>,
    reload: () => void
}>(TheGreatLie());

export const ModuleProvider = (props: { children: React.ReactNode }) => {
    const [subscriptions, reloadSubscriptions] = useLoadable(() => API.Modules.subscriptions());
    const [mine, reloadMine] = useLoadable(() => API.Modules.mine());

    const reload = () => {
        reloadSubscriptions();
        reloadMine();
    };

    return (
        <ModuleContext.Provider value={{ subscriptions, mine, reload }}>
            {props.children}
        </ModuleContext.Provider>
    );
}