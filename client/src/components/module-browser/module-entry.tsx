import { Lesson } from "@hypatia-app/backend/dist/client";
import * as React from "react";

import { useNav } from "../../hooks"

export interface Props {
    moduleName: string;
    modulePath: string;
    lessons: Lesson.AsWire[];
    open: boolean;
    onOpen: (open: boolean) => void;
}

export const ModuleEntry = (props: Props) => {
    const navigate = useNav();

    return (
        <div
            className={"module-entry"}
            data-open={props.open}
            style={{ "--max-height": `${props.lessons.length * 24}px` } as any}
        >
            <div
                className={"module-name"}
                onClick={() => props.onOpen(!props.open)}
            >
                { props.moduleName }
            </div>
            <div className={"lesson-list"}>
                {
                    props.lessons.map((lesson) => (
                        <div
                            className="lesson"
                            key={lesson.path}
                            onClick={navigate(`/${props.modulePath}/${lesson.path}/${lesson.pages[0].path}`)}
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