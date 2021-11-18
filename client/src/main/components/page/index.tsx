import * as React from "react";
import { Loadable } from "@hypatia-app/common";
import { Page as PageType } from "@hypatia-app/backend/dist/client";

import { usePage } from "../../hooks";
import { API } from "../../api";
import { SettingsContext } from "../../providers/settings-provider";
import { View } from "./view";
import { Navigation } from "./navigation";
import { withVerification } from "../verification";
import { PageOptionsProvider } from "../../providers/page-options-provider";
import { QuizProvider } from "../../providers/quiz-provider";
import { QuizNavigation } from "../markdown/quiz-navigation";

import "./index.scss";
import { Loading } from "../loading";

export const Page = withVerification(() => {
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
        return <div className="page"><Loading/></div>;
    }

    return (
        <QuizProvider>
            <PageOptionsProvider options={pageData.value.options ?? {}}>
                <div className="page">
                    <div className="view">
                        <View module={module} lesson={lesson} view={pageData.value.view}/>
                    </div>
                    <QuizNavigation/>
                    <Navigation/>
                </div>
            </PageOptionsProvider>
        </QuizProvider>
    );
});