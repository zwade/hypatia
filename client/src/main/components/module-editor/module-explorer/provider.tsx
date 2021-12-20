// This is a component-internal provider, so we don't include it in the greater provider directory

import * as React from "react";
import { Module } from "@hypatia-app/backend";
import { TheGreatLie } from "react-pwn";
import { useLoadable } from "../../../hooks";
import { API } from "../../../api";
import { Loading } from "../../loading";

export interface ContextData {
    module: Module.WithSettings;
    refresh: () => void;
}

export const EditorContext = React.createContext<ContextData>(TheGreatLie());

export interface Props {
    children: React.ReactNode;
    module: string;
}

export const EditorProvider = (props: Props) => {
    const [moduleLoadable, refresh] = useLoadable(() => API.Modules.get(props.module));

    if (!moduleLoadable.value) {
        if (moduleLoadable.loading) {
            return <Loading/>;
        } else {
            return (
                <div className="error">Something went wrong</div>
            );
        }
    }

    const module = moduleLoadable.value;

    return (
        <EditorContext.Provider value={{ module, refresh }}>
            { props.children }
        </EditorContext.Provider>
    )
};