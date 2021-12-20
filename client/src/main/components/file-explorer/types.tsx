export type Tree = Entry[];

export interface EntryCommon {
    id: string;
    name: string;
    onRename?: (newName: string) => void;
    onDelete?: () => void;
}

export type Entry =
    | { kind: "file", onSelect: () => void } & EntryCommon
    | { kind: "directory", entries: Tree } & EntryCommon;
