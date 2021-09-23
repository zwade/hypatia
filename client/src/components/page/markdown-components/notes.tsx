import { classes } from "react-pwn";

export interface Props {
    kind: "inline" | "text-area";
    big: boolean;
}

export const Notes = (props: Props) => {
    // TODO(zwade): Make these save answers
    // TODO(zwade): Make these real components
    if (props.kind === "inline") {
        return (
            <div className={classes("notes-input", "inline", props.big ? "big" : "")}>
                <input/>
            </div>
        );
    } else {
        return (
            <div className={classes("notes-input", props.big ? "big" : "")}>
                <textarea/>
            </div>
        );
    }
}