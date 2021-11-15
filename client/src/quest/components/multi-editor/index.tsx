import * as React from "react";
import { classes } from "react-pwn";

import { FileContext } from "../../providers/file-provider";
import { Editor } from "../editor";

import "./index.scss";

export const MultiEditor = () => {
    const { files, updateFile, selectFile, selected } = React.useContext(FileContext);

    const languageList = files.keySeq().toList().sort((a, b) => a.localeCompare(b)).toArray();

    React.useEffect(() => {
        if (selected === undefined && languageList.length > 0) {
            selectFile(languageList[0]);
        }
    }, [])

    if (languageList.length === 0 || selected === undefined) {
        return <div>No files</div>;
    }

    return (
        <div className="multi-editor">
            <div className="tab-list">
            {
                languageList.map((file) => (
                    <div
                        key={file}
                        className={`tab ${file === selected ? "selected" : ""}`}
                        onClick={() => selectFile(file)}
                    >
                        { file }
                    </div>
                ))
            }
            </div>
            <div className={classes("multi-editor-holder")}>
                <Editor
                    key={selected}
                    data={files.get(selected) ?? ""}
                    language={selected}
                    onChange={(data) => updateFile(selected, data)}
                />
            </div>
        </div>
    )
}