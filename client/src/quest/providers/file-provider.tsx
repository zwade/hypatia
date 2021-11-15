import * as React from "react";
import { Map as IMap } from "immutable";
import { TheGreatLie } from "react-pwn";

export interface FileProviderData {
    files: IMap<string, string>;
    updateFile: (file: string, content: string) => void;
    selected: string | undefined,
    selectFile: (file: string) => void;
}

export const FileContext = React.createContext<FileProviderData>(TheGreatLie());

export interface Props {
    children: React.ReactNode;
    templates?: IMap<string, string>;
}

export const FileProvider = (props: Props) => {
    const [files, setFiles] = React.useState(props.templates ?? IMap<string, string>());
    const [selected, setSelected] = React.useState<string | undefined>();

    const updateFile = (file: string, content: string) => {
        setFiles(files.set(file, content));
    };



    return (
        <FileContext.Provider value={{ files, updateFile, selected, selectFile: setSelected }}>
            {props.children}
        </FileContext.Provider>
    );
}