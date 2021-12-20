import * as React from "react";
import { classes } from "react-pwn"
import { ContextMenu } from "../context-menu/context-menu";

export interface Props {
    name: string;
    onClick: () => void;
    setHeight?: (n: number) => void;
    depth: number;
    selected: boolean;
}

export const File = (props: Props) => {
    React.useEffect(() => {
        props.setHeight?.(1);
    }, [])

    return (
        <ContextMenu
            segments={[
                { name: "open", onClick: () => {} },
            ]}
        >
            <div
                className={classes("file", props.selected ? "selected" : "")}
                onClick={props.onClick}
                style={{ "--depth": `${props.depth}` }}
            >
                <div className="file-name">{props.name}</div>
            </div>
        </ContextMenu>
    )
}