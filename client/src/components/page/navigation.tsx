import { useParams } from "react-router";
import * as React from "react";

import { useNav } from "../../hooks"
import { ModuleContext } from "../../providers/module-provider";
import { classes } from "../../utils/utils";

export interface Props {

}

export const Navigation = () => {
    const { module, lesson, page: pageStr } = useParams<{ module: string, lesson: string, page: string }>();
    const { data } = React.useContext(ModuleContext);
    const navigate = useNav();

    if (!data) {
        return <div className="navigation"/>;
    }

    const lessonList = [...data.get(module)?.keys() ?? []]
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const page = parseInt(pageStr, 10);
    const pagesInLesson = data.get(module)?.get(lesson) ?? 0;
    const lessonIdx = lessonList.indexOf(lesson);

    const nextPage =
        page < pagesInLesson - 1 ? `/${module}/${lesson}/${page + 1}` :
        lessonIdx < lessonList.length - 1 ? `/${module}/${lessonList[lessonIdx + 1]}/0` :
        "/";

    const nextPageName =
        page < pagesInLesson - 1 ? "Next Page" :
        lessonIdx < lessonList.length - 1 ? "Next Lesson" :
        "Table of Contents";

    const prevPage =
        page > 0 ? `/${module}/${lesson}/${page - 1}` :
        lessonIdx > 0 ? `/${module}/${lessonList[lessonIdx - 1]}/${data.get(module)!.get(lessonList[lessonIdx - 1])! - 1}` :
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
                <div className="module">{ module }</div>
                <div className="lesson">{ lesson }</div>
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