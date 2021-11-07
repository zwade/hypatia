import { useParams } from "react-router";
import * as React from "react";
import { Loadable } from "@hypatia-app/common";

import { useNav } from "../../hooks"
import { ModuleContext } from "../../providers/module-provider";
import { classes } from "../../utils/utils";

export interface Props {

}

export const Navigation = () => {
    const { module: modulePath, lesson: lessonPath, page: pageStr } = useParams<{ module: string, lesson: string, page: string }>();
    const { subscriptions, mine } = React.useContext(ModuleContext);
    const navigate = useNav();


    if (!subscriptions.value || !mine.value) {
        return <div className="navigation"/>;
    }

    const data = subscriptions.value.concat(mine.value);

    const module = data.find(({ bundle: { path } }) => path === modulePath)?.bundle;
    const lessonIdx = module?.lessons.findIndex(({ path }) => path === lessonPath);

    if (module === undefined || lessonIdx === undefined) {
        return (<div className="navigation"/>);
    }

    const lesson = module.lessons[lessonIdx];
    const page = lesson.pages.findIndex(({ path }) => path === pageStr);
    const pagesInLesson = lesson.pages.length;

    const getPath = (lIdx: number, pIdx: number) => {
        const lesson = lIdx >= 0 ? module.lessons[lIdx] : module.lessons[module.lessons.length + lIdx];
        const page = pIdx >= 0 ? lesson.pages[pIdx] : lesson.pages[lesson.pages.length + pIdx];

        return `/${module.path}/${lesson.path}/${page.path}`;
    }

    const nextPage =
        page < pagesInLesson - 1 ? getPath(lessonIdx, page + 1) :
        lessonIdx < module.lessons.length - 1 ? getPath(lessonIdx + 1, 0) :
        "/";

    const nextPageName =
        page < pagesInLesson - 1 ? "Next Page" :
        lessonIdx < module.lessons.length - 1 ? "Next Lesson" :
        "Table of Contents";

    const prevPage =
        page > 0 ? getPath(lessonIdx, page - 1) :
        lessonIdx > 0 ? getPath(lessonIdx - 1, -1) :
        "/";

    const prevPageName =
        page > 0 ? "Previous Page" :
        lessonIdx > 0 ? "Previous Lesson" :
        "Table of Contents";

    return (
        <div className="navigation">
            <div
                className={classes("nav-button", "navigation-previous", page === 0 ? "disabled" : undefined)}
                onClick={navigate(prevPage)}
            >
                { prevPageName }
            </div>
            <div className="navigation-current nav-button" onClick={navigate("/")}>
                <div className="module">{ modulePath }</div>
                <div className="lesson">{ lessonPath }</div>
                <div className="pageno">{ `${page + 1}/${pagesInLesson}` }</div>
            </div>
            <div
                className={classes("nav-button", "navigation-next", page === 0 ? "disabled" : undefined)}
                onClick={navigate(nextPage)}
            >
                { nextPageName }
            </div>
        </div>
    )
}