import { Module } from "@hypatia-app/backend";
import * as React from "react";
import { API } from "../../api";
import { useLoadable } from "../../hooks";

import { ModuleContext } from "../../providers/module-provider";
import { Loading } from "../loading";
import { ModuleOption } from "../module-option";
import { withVerification } from "../verification";

import "./index.scss";
import { MineModal } from "./mine-modal";
import { PublicModal } from "./public-modal";
import { SubscriptionModal } from "./subscription-modal";

type SelectedModule = {
    type: "subscription" | "mine" | "public",
    module: Module.WithSettings
};

export const ModuleBrowser = withVerification(() => {
    const { subscriptions, mine, reload: reloadModules } = React.useContext(ModuleContext);
    const [selected, setSelected] = React.useState<SelectedModule | null>(null);
    const [publicModules, reloadPublic] = useLoadable(API.Modules.pub);

    const reload = () => {
        reloadModules();
        reloadPublic();
    }

    if (subscriptions.loading && mine.loading) {
        return <Loading/>;
    }

    const SelectionModal =
        !selected ? undefined :
        selected.type === "subscription" ? <SubscriptionModal module={selected.module} onClose={() => setSelected(null)} /> :
        selected.type === "mine" ? <MineModal module={selected.module} onClose={() => setSelected(null)} /> :
        selected.type === "public" ? <PublicModal module={selected.module} onClose={() => setSelected(null)} reload={reload} /> :
        undefined;

    return (
        <div className="module-browser">
            { SelectionModal }
            {
                subscriptions.value && subscriptions.value.length > 0 ? (
                    <div className="module-view subscriptions">
                        <h2>Module Library</h2>
                        <div className="module-list">
                            {
                                subscriptions.value.map((module) => (
                                    <ModuleOption
                                        module={module}
                                        key={module.bundle.path}
                                        onClick={() => setSelected({ type: "subscription", module })}
                                    />
                                ))
                            }
                        </div>
                    </div>
                ) : undefined
            }
            {
                mine.value && mine.value.length > 0 ? (
                    <div className="module-view mine">
                        <h2>My Modules</h2>
                        <div className="module-list">
                            {
                                mine.value.map((module) => (
                                    <ModuleOption
                                        module={module}
                                        key={module.bundle.path}
                                        onClick={() => setSelected({ type: "mine", module })}
                                    />
                                ))
                            }
                        </div>
                    </div>
                ) : undefined
            }
            {
                publicModules.value && publicModules.value.length > 0 ? (
                    <div className="module-view mine">
                        <h2>Browse Public Modules</h2>
                        <div className="module-list">
                            {
                                publicModules.value.map((module) => (
                                    <ModuleOption
                                        module={module}
                                        key={module.bundle.path}
                                        onClick={() => setSelected({ type: "public", module })}
                                    />
                                ))
                            }
                        </div>
                    </div>
                ) : undefined
            }
        </div>
    );
});