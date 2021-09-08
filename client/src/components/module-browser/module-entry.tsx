import { useNav } from "../../hooks"

export interface Props {
    module: string;
    lessons: [string, number][];
}

export const ModuleEntry = (props: Props) => {
    const navigate = useNav();

    return (
        <div className={"module-entry"}>
            <div className={"module-name"}>{ props.module }</div>
            <div className={"lesson-list"}>
                {
                    props.lessons.map(([lesson, pages]) => (
                        <div
                            className="lesson"
                            key={lesson}
                            onClick={navigate(`/${props.module}/${lesson}/0`)}
                        >
                            { `${lesson} (${pages})` }
                        </div>
                    ))
                }
            </div>
        </div>
    )
}