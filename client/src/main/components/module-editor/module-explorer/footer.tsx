import * as React from "react";
import { EditorContext } from "./provider";

export const EditorFooter = () => {
    const { module } = React.useContext(EditorContext);

    return (
        <div className="module-editor-footer">
            Editing: { module.bundle.name }
        </div>
    )
}