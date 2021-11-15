import * as React from "react";

import { ModuleContext } from "../../providers/module-provider";
import { ModuleEntry } from "./module-entry";

import "./index.scss";
import { useLocalStorage } from "../../hooks";
import { SettingsContext } from "../../providers/settings-provider";
import { withVerification } from "../verification";

export interface Props {

}

export const ModuleBrowser = withVerification((props: Props) => {
    const { subscriptions: data } = React.useContext(ModuleContext);
    const [open, setOpen] = useLocalStorage<number | null>("toc-active-module", null);
    const { setPage } = React.useContext(SettingsContext);

    React.useEffect(() => {
        setPage(undefined);
    }, []);

    if (data.value === undefined) {
        return (
            <div className="module-browser">
                <div className="loading-message">Loading Modules</div>
            </div>
        );
    }

    const modules = data.value
        .sort(({ bundle: a }, { bundle: b }) => a.name.localeCompare(b.name));


    return (
        <div className="module-browser">
            <div className="title">Available Modules</div>
            <div className="table-of-contents">
                {
                    modules.map(({ bundle: module }, idx) => (
                        <ModuleEntry
                            key={module.path}
                            moduleName={module.name}
                            modulePath={module.path}
                            lessons={module.lessons}
                            open={open === idx}
                            onOpen={(open) => {
                                setOpen(open ? idx : null);
                            }}
                        />
                    ))
                }
            </div>
        </div>
    )
});