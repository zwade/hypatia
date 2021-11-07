import * as WebSocket from "ws";
import { ProtocolWebSocket, StableStream } from "@hypatia-app/common";
import { Connection, Service } from "@hypatia-app/backend";

import { ControlProtocol } from "./types";
import { Container, ContainerManager } from "./docker";

const connectClient = (baseUrl: URL, token: string, connection: Connection.t, container: Container) => {
    const url = new URL("/ws-bridge/session", baseUrl);
    url.search = new URLSearchParams({ token, connection: connection.name }).toString()

    // It's a thunk because we don't buffer, so we don't want to connect until the handlers are established
    const ws = StableStream.fromWebSocket(new WebSocket(url));

    if (connection.kind === "pty") {
        return container.bindTty(ws);
    } else {
        return container.bindPort(ws, connection.port);
    }
}

interface Session {
    userId: string;
    service: Service.t;
    options: ControlProtocol.Options;
}


export const start = async (baseUrl: URL) => {
    const containers = new ContainerManager(true);

    const url = new URL("/ws-bridge/control", baseUrl);
    const rawWs = new WebSocket(url);
    const ws = new ProtocolWebSocket<ControlProtocol.FromClient, ControlProtocol.FromServer>(rawWs);

    const services = new Map<string, Session>();

    await ws.ready;
    await new Promise(resolve => setTimeout(resolve, 100));

    ws.send({ kind: "register", capabilities: {}, token: "" })
    for await (const msg of ws.queue) {
        switch (msg.kind) {
            case "request-session": {
                const { token, userId, service, options } = msg;
                ws.send({ kind: "session-response", accepted: true, token });
                services.set(token, { userId, service, options})

                break;
            }
            case "update-session": {
                let container = await containers.findContainer(msg.token);
                if (container === undefined) {
                    console.warn("Cannot resize non-existant container");
                    break;
                }

                const status = await container.getStatus();
                if (!status.Running) {
                    await container.start();
                }

                if (msg.options.cols !== undefined && msg.options.rows !== undefined) {
                    const cols = msg.options.cols;
                    const rows = msg.options.rows;
                    await container.resize(cols, rows);
                }

                break;
            }
            case "request-connection": {
                const { token, connection } = msg;
                const session = services.get(token);
                if (!session) {
                    console.warn("Could not find session");
                    break;
                }

                const service = session.service;
                const conn = service.connections?.find(({ name }) => name === connection);
                if (!conn) {
                    console.warn("Could not find connection");
                    break;
                }

                let container = await containers.findContainer(token);
                if (container === undefined) {
                    container = await containers.createContainer(token, session.userId, service);
                }

                const status = await container.getStatus();
                if (!status.Running) {
                    await container.start();
                }

                await connectClient(baseUrl, token, conn, container);
            }
        }
    }
}