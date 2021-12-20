import * as React from "react";
import { Subtree } from "./subtree";
import { Tree } from "./types";

import "./index.scss";

export interface Props {
    tree: Tree;
    name: string;
    selected?: string[];
}

export const FileExplorer = (props: Props) => {
    return (
        <div className="file-explorer" style={{ "--entry-height": "28px" }}>
            <Subtree subtree={props.tree} selected={props.selected} name={props.name} open={true}/>
        </div>
    )
}