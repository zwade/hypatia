import { TypedEventEmitter } from "@hypatia-app/common";
import * as React from "react";
import { TheGreatLie } from "react-pwn";
import { FromApp, FromQuest, GetMessages, ToQuest } from "../messages";

export interface Configuration {
    module: string;
    lesson: string;
    file: string;
    signature: string;
}

export interface Status {
    correct: number;
    total: number;
}


export interface ContextData {
    configuration?: Configuration;
    onReport: (cb: () => void) => void;
    report: (status: Status) => void;
}

export const MessageContext = React.createContext<ContextData>(TheGreatLie());

type Emitter = TypedEventEmitter<
    "rx" | "tx",
    {
        rx: [FromApp];
        tx: [FromQuest];
    }
>;

export const MessageProvider = (props: { children: React.ReactNode }) => {
    const [configuration, setConfiguration] = React.useState<Configuration | undefined>();
    const reportCb = React.useRef<() => void>();
    const emitterRef = React.useRef<Emitter | null>(null);

    React.useEffect(() => {
        const emitter = GetMessages<ToQuest, FromQuest>(window, window.parent);
        emitterRef.current = emitter;

        emitter.on("rx", async (data) => {
            switch (data.kind) {
                case "configuration": {
                    const { kind: _kind, ...config } = data;
                    setConfiguration(config);
                    break;
                }
                case "report-requested": {
                    if (reportCb.current !== undefined) {
                        reportCb.current();
                    }
                    break;
                }
            }
        });

        emitter.emit("tx", { kind: "loaded" });
    }, []);

    const report = (status: Status) => {
        emitterRef.current?.emit("tx", { kind: "status-update", ...status });
    }

    const onReport = (cb: () => void) => {
        reportCb.current = cb;
    }

    return (
        <MessageContext.Provider value={{ configuration, report, onReport }}>
            {props.children}
        </MessageContext.Provider>
    )
}