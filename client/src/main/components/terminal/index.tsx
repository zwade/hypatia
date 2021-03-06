import { XTerm } from "xterm-for-react";
import { AttachAddon } from "xterm-addon-attach";
import { FitAddon } from "xterm-addon-fit";
import * as React from "react";

import { TerminalConnection } from "../../utils/terminal";
import { useLocalStorage } from "../../hooks";
import { Material } from "./themes/material";
import { TerminalRunContext } from "../../providers/terminal-run";

import "./index.scss";

export interface Props {
    module: string;
    lesson: string;
    connection: string;
}

export const Terminal = (props: Props) => {
    const [xterm, setXterm] = React.useState<XTerm | null>(null);
    const { onRun, offRun } = React.useContext(TerminalRunContext);
    const { current: fitAddon } = React.useRef(new FitAddon());
    const [conn, setConn] = React.useState<TerminalConnection | null>(null);
    const [resetTracker, setResetTracker] = React.useState({});
    const [initialized, setInitialized] = React.useState(false);

    const loadConnection = () => {
        if (xterm === null) return

        const conn = new TerminalConnection(
            props.module,
            props.lesson,
            props.connection,
            xterm.terminal.rows,
            xterm.terminal.cols,
        );
        setConn(conn);

        return conn;
    }

    React.useEffect(() => {
        document.fonts.load("12px Iosevka Web")
            .then(() => document.fonts.load("Bold 12px Iosevka Web"))
            .then(() => {
                if (!initialized) {
                    setInitialized(true);
                }
            });
    }, []);

    React.useEffect(() => {
        const conn = loadConnection();

        return () => {
            conn?.kill();
        }
    }, [xterm, resetTracker, initialized]);

    React.useEffect(() => {
        if (xterm === null) return
        xterm.terminal.setOption("theme", Material);

        const resizeObserver = new ResizeObserver(() => fitAddon.fit());

        xterm.terminal.loadAddon(fitAddon);
        resizeObserver.observe(xterm.terminalRef.current!);
    }, [xterm]);

    React.useEffect(() => {
        if (xterm === null) return
        if (conn === null) return

        const onFinish = (ws: WebSocket) => {
            const attachAddon = new AttachAddon(ws);
            xterm.terminal.loadAddon(attachAddon);

            fitAddon.fit();
            conn.resize(xterm.terminal.rows, xterm.terminal.cols);
        }
        const onClose = () => {
            setConn(null);
        }
        const onResize = ({ cols, rows }: { cols: number, rows: number }) => conn.resize(rows, cols);
        const onRunHandler = (cmd: string) => conn.write(cmd);

        conn.on("finish", onFinish);
        conn.on("close", onClose)
        onRun(onRunHandler);
        const disposeResize = xterm.terminal.onResize(onResize);

        conn.connect();

        return () => {
            conn.off("finish", onFinish);
            conn.off("close", onClose);
            offRun(onRunHandler);
            disposeResize.dispose();
        }
    }, [xterm, conn]);

    if (!initialized) {
        return (
             <div
                className="terminal-screen"
                style={{ backgroundColor: Material["background"] }}
            />
        );
    }

    return (
        <div
            className="terminal-screen"
            style={{ backgroundColor: Material["background"] }}
        >
            {
                conn === null ? (
                    <div
                        className="terminal-disconnected"
                        onClick={() => { setResetTracker({}); }}
                    >
                        Lost connection to server. Click to reconnect.
                    </div>
                ) : null
            }
            <XTerm ref={setXterm} options={{ convertEol: true, fontFamily: "Iosevka Web" }} className="terminal-wrapper"/>
        </div>
    )
}