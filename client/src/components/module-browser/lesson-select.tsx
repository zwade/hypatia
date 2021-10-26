import * as React from "react";
import type { Lesson, Module } from "@hypatia-app/backend";

import { useNav } from "../../hooks"

export interface Props {
    module: Module.WithSettings;
}

export const LessonSelect = (props: Props) => {
    const [open, setOpen] = React.useState(false);
    const navigate = useNav();

    const bundle = props.module.bundle;

    return (
        <div
            className={"module-entry"}
            data-open={open}
            style={{ "--max-height": `${bundle.lessons.length * 32}px` } as any}
        >
            <div
                className={"module-name"}
                onClick={() => setOpen(!open)}
            >
                Lessons
            </div>
            <div className={"lesson-list"}>
                {
                    bundle.lessons.map((lesson) => (
                        <div
                            className="lesson"
                            key={lesson.path}
                            onClick={navigate(`/${bundle.path}/${lesson.path}/${lesson.pages[0].path}`)}
                        >
                            { lesson.name }
                            <span className="pages">{ `(${lesson.pages.length} pages)` }</span>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}