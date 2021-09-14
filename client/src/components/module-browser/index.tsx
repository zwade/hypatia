import * as React from "react";

import { ModuleContext } from "../../providers/module-provider";
import { ModuleEntry } from "./module-entry";

import "./index.scss";

export interface Props {

}

export const ModuleBrowser = (props: Props) => {
    const { data } = React.useContext(ModuleContext);
    const [open, setOpen] = React.useState<number | undefined>(undefined);

    if (data === undefined) {
        return (
            <div className="module-browser">
                <div className="loading-message">Loading Modules</div>
            </div>
        );
    }

    const modules = [...data.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, lessons]) => ([
            name,
            [...lessons.entries()]
                .sort((a, b) => a[0].localeCompare(b[0]))
        ] as const))


    return (
        <div className="module-browser">
            <div className="title">Available Modules</div>
            <div className="table-of-contents">
                {
                    modules.map(([module, lessons], idx) => (
                        <ModuleEntry
                            key={module}
                            module={module}
                            lessons={lessons}
                            open={open === idx}
                            onOpen={(open) => {
                                setOpen(open ? idx : undefined);
                            }}
                        />
                    ))
                }
            </div>
        </div>
    )
}