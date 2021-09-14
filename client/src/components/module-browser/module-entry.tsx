import * as React from "react";

import { useNav } from "../../hooks"

export interface Props {
    module: string;
    lessons: [string, number][];
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
                { props.module }
            </div>
            <div className={"lesson-list"}>
                {
                    props.lessons.map(([lesson, pages]) => (
                        <div
                            className="lesson"
                            key={lesson}
                            onClick={navigate(`/${props.module}/${lesson}/0`)}
                        >
                            { lesson }
                            <span className="pages">{ `(${pages} pages)` }</span>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}