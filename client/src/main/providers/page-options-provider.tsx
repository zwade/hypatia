import * as React from "react";

import type { Page } from "@hypatia-app/backend"

type _Options<T = Page.AsWire["options"]> = T extends undefined ? never : T;
export type Options = _Options;

export const PageOptionsContext = React.createContext({} as Options);

export const PageOptionsProvider = (props: { options: Options, children: React.ReactNode }) => {
    return (
        <PageOptionsContext.Provider value={props.options}>
            {props.children}
        </PageOptionsContext.Provider>
    );
}