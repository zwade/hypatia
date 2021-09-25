import * as WebSocket from "ws";
import { ProtocolWebSocket } from "@hypatia-app/common";
import * as pty from "node-pty";

import { ControlProtocol } from "./types";

const sessions: Map<string, pty.IPty> = new Map();

const connectClient = (baseUrl: URL, token: string) => {
    const url = new URL("/ws-bridge/session", baseUrl);
    url.search = new URLSearchParams({ token }).toString()
    const ws = new WebSocket(url);

    const term = pty.spawn("docker", ["run", "-it", "ubuntu", "/bin/bash"], {
        name: "xterm-256color",
        cols: 80,
        rows: 24,
        cwd: "/",
        encoding: "utf-8",
    });

    term.onExit(() => ws.close());

    ws.on("message", (msg) => {
        const msgAsBuffer =
            Array.isArray(msg) ? Buffer.concat(msg) :
            Buffer.from(msg as string, "utf-8");

        term.write(msgAsBuffer.toString("utf-8"))
    });

    ws.on("open", () => {
        term.onData((data) => ws.send(data));
    });

    sessions.set(token, term);
}

export const start = async (baseUrl: URL) => {
    const url = new URL("/ws-bridge/control", baseUrl);
    const rawWs = new WebSocket(url);
    const ws = new ProtocolWebSocket<ControlProtocol.FromClient, ControlProtocol.FromServer>(rawWs);

    ws.send({ kind: "register", capabilities: {}, token: "" })
    for await (const msg of ws.queue) {
        switch (msg.kind) {
            case "request-session": {
                const { requestToken } = msg;
                ws.send({ kind: "session-response", accepted: true, requestToken });
                connectClient(baseUrl, requestToken);
                break;
            }
            case "update-session": {
                const terminal = sessions.get(msg.sessionToken);
                if (!terminal) {
                    console.warn("Asked to resize non-existant terminal");
                    break;
                }
                terminal.resize(msg.cols, msg.rows);
            }
        }
    }
}