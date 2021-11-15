import * as React from "react";
import type { Module } from "@hypatia-app/backend";

import { API } from "../../api";
import { useLoadable } from "../../hooks";
import { ModuleOption } from "../module-option";
import { EditPane } from "./edit-pane";

export const Selector = () => {
    const [modules, refreshModules] = useLoadable(() => API.Modules.mine());
    const [selected, setSelected] = React.useState<Module.WithSettings | null>(null);

    const onChange = async function (this: HTMLInputElement, e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length !== 1) return;
        const formData = new FormData();
        formData.set("module", e.target.files[0]);

        await fetch("/modules", {
            method: "POST",
            body: formData,
        });

        refreshModules();

        e.target.value = "";
    }

    if (!modules.value) return <>Loading...</>;

    return (
        <>
            {
                selected !== null
                    ? <EditPane module={selected} onClose={() => setSelected(null)} refresh={refreshModules} />
                    : undefined
            }
            <div className="module-selector">
                {
                    modules.value.map((module) => (
                        <ModuleOption
                            key={module.bundle.path}
                            module={module}
                            onClick={() => setSelected(module)}
                        />
                    ))
                }
                <label htmlFor="hidden-input"  className="upload-new"/>
            </div>
            <input onChange={onChange} id="hidden-input" type="file" accept=".zip"/>
        </>
    );
}