import * as React from "react";
import { useParams } from "react-router";
import { EditorProvider } from "./provider";

import "./index.scss";
import { EditorFooter } from "./footer";
import { Sidebar } from "./sidebar";

export const ModuleExplorer = () => {
    const { module } = useParams<{ module: string }>();

    return (
        <div className="module-explorer">
            <EditorProvider module={module}>
                <Sidebar/>
                <EditorFooter/>
            </EditorProvider>
        </div>
    );
}