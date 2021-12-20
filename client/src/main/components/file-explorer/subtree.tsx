import * as React from "react";

import { Tree } from "./types";
import { File } from "./file";
import { classes } from "react-pwn";
import { useHeight } from "./height-math";

export interface Props {
    subtree: Tree;
    name: string;
    open: boolean;
    setHeight?: (height: number) => void;
    depth?: number;
    selected?: string[];
}

export const Subtree = (props: Props) => {
    const [shown, setShown] = React.useState(false);
    const { height, setHeight } = useHeight();

    React.useEffect(() => {
        props.setHeight?.(shown ? height + 1 : 1);
    }, [shown, height]);

    const depth = props.depth ?? 0;

    return (
        <div
            className={classes("subtree", shown ? "shown" : "hidden")}
            style={{ "--depth": `${depth}`}}
        >
            <div className="directory" onClick={() => setShown(!shown)}>{ props.name }</div>
            <div
                className={"collapsible"}
                style={{ "--size": `${height}` }}
            >
            {
                props.subtree.map((entry, i) => (
                    entry.kind === "file"
                        ? <File
                            key={entry.name}
                            name={entry.name}
                            onClick={entry.onSelect}
                            selected={props.selected?.[0] === entry.id && props.selected?.length === 1}
                            setHeight={setHeight(i)}
                            depth={depth + 1}
                        />
                        : <Subtree
                            key={entry.name}
                            subtree={entry.entries}
                            name={entry.name}
                            open={shown}
                            setHeight={setHeight(i)}
                            depth={depth + 1}
                            selected={props.selected?.[0] === entry.id ? props.selected.slice(1) : undefined}
                        />
                ))
            }
            </div>
        </div>
    )
}