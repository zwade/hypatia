import * as React from "react";
import { Loadable } from "@hypatia-app/common";
import { Page as PageType } from "@hypatia-app/backend/dist/client";

import { usePage } from "../../hooks";
import { API } from "../../api";
import { SettingsContext } from "../../providers/settings-provider";
import { View } from "./view";
import { Navigation } from "./navigation";

import "./index.scss";

export const Page = () => {
    const { module, lesson, page, path } = usePage()!;
    const [pageData, setPageData] = React.useState<Loadable<PageType.AsWire>>(() => API.Modules.pageData(module, lesson, page));
    const { setPage } = React.useContext(SettingsContext);

    React.useEffect(() => {
        if (pageData.kind === "loading") {
            pageData.then(setPageData);
        }
    }, []);

    React.useEffect(() => {
        setPage({ module, lesson, page });
    }, [module, lesson, page]);

    React.useEffect(() => {
        API.Modules.pageData(module, lesson, page).then(setPageData);
    }, [module, lesson, page]);

    if (!pageData.value) {
        return <div className="page">Loading...</div>;
    }

    return (
        <div className="page">
            <div className="view">
                <View module={module} lesson={lesson} view={pageData.value.view}/>
            </div>
            <Navigation/>
        </div>
    );
}