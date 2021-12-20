import * as React from "react";
import { FileExplorer } from "../../file-explorer";
import { Tree } from "../../file-explorer/types";
import { EditorContext } from "./provider";

export const Sidebar = () => {
    const { module } = React.useContext(EditorContext);
    const [selected, setSelected] = React.useState<string[]>();

    const tree = React.useMemo((): Tree => {
        return module.bundle.lessons.map((lesson) => ({
            kind: "directory",
            id: lesson.path,
            name: lesson.name,
            entries: lesson.pages.map((page, i) => ({
                kind: "file",
                id: page.path,
                name: `Page ${i}`,
                onSelect: () => {
                    setSelected([lesson.path, page.path]);
                }
            }))
        }))
    }, [module.bundle]);

    return (
        <div className="module-editor-sidebar">
            <FileExplorer tree={tree} name="Module Contents" selected={selected}/>
        </div>
    );
}