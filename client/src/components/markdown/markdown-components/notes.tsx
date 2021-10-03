import * as React from "react";
import { classes } from "react-pwn";
import { useLocalStorage, usePage } from "../../../hooks";

export interface Props {
    kind: "inline" | "text-area";
    big: boolean;
    id: number;
}

export const Notes = (props: Props) => {
    const page = usePage()!;
    const [value, setValue] = useLocalStorage(`${page.path}/${props.id}`, "");

    // TODO(zwade): Make these save answers
    // TODO(zwade): Make these real components
    if (props.kind === "inline") {
        return (
            <div className={classes("notes-input", "inline", props.big ? "big" : "")}>
                <input value={value} onChange={(e) => setValue(e.target.value)}/>
            </div>
        );
    } else {
        return (
            <div className={classes("notes-input", props.big ? "big" : "")}>
                <textarea value={value} onChange={(e) => setValue(e.target.value)}/>
            </div>
        );
    }
}