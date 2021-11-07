import * as React from "react";
import type { Module } from "@hypatia-app/backend/dist/client";
import { Loadable } from "@hypatia-app/common";

import { API } from "../api";
import { TheGreatLie } from "react-pwn";
import { useLoadable } from "../hooks";
import { UserContext } from "./user-provider";

export const ModuleContext = React.createContext<{
    subscriptions: Loadable<Module.WithSettings[]>,
    mine: Loadable<Module.WithSettings[]>,
    reload: () => void
}>(TheGreatLie());

export const ModuleProvider = (props: { children: React.ReactNode }) => {
    const { user } = React.useContext(UserContext);
    const [subscriptions, reloadSubscriptions] = useLoadable(() => API.Modules.subscriptions());
    const [mine, reloadMine] = useLoadable(() => API.Modules.mine());

    const reload = () => {
        reloadSubscriptions();
        reloadMine();
    };

    React.useEffect(() => {
        if (!subscriptions.value || !mine.value) {
            reload();
        }
    }, [user.value]);

    return (
        <ModuleContext.Provider value={{ subscriptions, mine, reload }}>
            {props.children}
        </ModuleContext.Provider>
    );
}