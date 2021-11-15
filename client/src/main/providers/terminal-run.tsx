import * as React from "react";

export type RunCB = (data: string) => void

export interface TerminalRunData {
    onRun: (cb: RunCB) => void;
    offRun: (cb: RunCB) => void;
    run: RunCB;
}

const complaint = () => { throw new Error("Context has not been initialized"); }

export const TerminalRunContext = React.createContext<TerminalRunData>({
    onRun: complaint,
    offRun: complaint,
    run: complaint,
});

export const TerminalRunProvider = (props: { children: React.ReactNode }) => {
    const cbs = React.useRef<Set<RunCB>>(new Set());

    const options = React.useMemo(() => ({
        onRun: (cb: RunCB) => cbs.current.add(cb),
        offRun: (cb: RunCB) => cbs.current.delete(cb),
        run: (data: string) => {
            for (const cb of cbs.current) {
                cb(data);
            }
        },
    }), []);

    return (
        <TerminalRunContext.Provider value={options}>
            {props.children}
        </TerminalRunContext.Provider>
    );
};