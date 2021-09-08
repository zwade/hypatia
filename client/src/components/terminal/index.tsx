import { XTerm } from "xterm-for-react";
import { AttachAddon } from "xterm-addon-attach";
import { FitAddon } from "xterm-addon-fit";
import * as React from "react";

import { TerminalConnection } from "../../utils/terminal";
import { useLocalStorage } from "../../hooks";

import "./index.scss";

export const Terminal = () => {
    const [sessionId, setSessionId] = useLocalStorage<null | number>("session-id", null);
    const [xterm, setXterm] = React.useState<XTerm | null>(null);

    React.useEffect(() => {
        if (xterm === null) return
        (window as any).xterm = xterm;

        const fitAddon = new FitAddon();
        const conn = new TerminalConnection(
            sessionId,
            xterm.terminal.rows,
            xterm.terminal.cols
        );

        xterm.terminal.loadAddon(fitAddon);
        const resizeObserver = new ResizeObserver(() => fitAddon.fit());
        resizeObserver.observe(xterm.terminalRef.current!);

        conn.on("finish", (ws, sid) => {
            setSessionId(sid);
            const attachAddon = new AttachAddon(ws);
            xterm.terminal.loadAddon(attachAddon);

            fitAddon.fit();
        });

        conn.connect();

        xterm.terminal.onResize(({ rows, cols }) => conn.resize(rows, cols));
    }, [xterm]);

    return (
        <XTerm ref={setXterm} className="fullscreen"/>
    )
}