import * as express from "express";
import * as os from "os";
import * as pty from "node-pty";
import { marshalParams, marshalQuery, Router, SafeError } from "@hypatia-app/common";
import { M, marshal } from "@zensors/sheriff";
import { v4 as uuid } from "uuid";

import * as WebSocket from "ws";
import { getModuleByPath } from "../modules";
import { ProxyManager } from "./proxy";
import { hostname, port, withSubdomain } from "../net-utils";

interface ActiveService {
    process: pty.IPty;
    ptyLogs: string;
    timeout?: NodeJS.Timeout;
    sockets: Map<string, Set<WebSocket>>;
    proxys: Map<string, ProxyManager>;
}

const processes: Map<string, ActiveService> = new Map();

const deleteSession = (session: string) => () => {
    const proc = processes.get(session);

    if (!proc) {
        return;
    }

    try {
        proc.process.kill();
        console.log('Closed terminal ' + session);
    } catch {
        // pass
    }

    for (const serviceConns of proc.sockets.values()) {
        for (const conn of serviceConns) {
            try {
                conn.close();
            } catch {
                // pass
            }
        }
    }

    for (const proxy of proc.proxys.values()) {
        proxy.kill();
    }

    processes.delete(session);
}

const clearTermination = (session: string) => {
    const proc = processes.get(session);
    if (proc?.timeout !== undefined) {
        clearTimeout(proc.timeout);
        proc.timeout = undefined;
    }
}

const scheduleTermination = (session: string, timeout = 30 * 60 * 1000) => {
    clearTermination(session);
    const proc = processes.get(session);
    if (!proc) {
        console.warn("Trying to schedule termination for non-existant process");
        return;
    }

    proc.timeout = setTimeout(deleteSession(session), timeout);
}


export const apiRouter = Router()
    .post("/:module/:lesson/service", (leaf) => leaf
        .then(marshalParams(M.obj({ module: M.str, lesson: M.str })))
        .then(marshalQuery(M.union(
            M.obj({ cols: M.opt(M.undef), rows: M.opt(M.undef), connection: M.str }),
            M.obj({ cols: M.str,          rows: M.str,          connection: M.str }))
        ))
        .return(async (req) => {
            const moduleCache = await getModuleByPath(req.params.module);
            const service = moduleCache.services.find((s) => s.connections?.some((c) => c.name === req.query.connection));
            if (!service) {
                throw new SafeError(404, "Connection not found");
            }

            const connection = service.connections!.find((c) => c.name === req.query.connection);
            if (!connection) {
                throw new SafeError(404, "Connection not found");
            }

            const sessionId = `${req.params.module}/${service.name}`;

            let rows: number;
            let cols: number;

            if (req.query.rows !== undefined && connection.kind === "pty") {
                rows = parseInt(req.query.rows, 10);
                cols = parseInt(req.query.cols, 10);
            } else {
                rows = 24;
                cols = 80;
            }

            const wsUri =
            `/ws-api/${
                encodeURIComponent(req.params.module)
            }/${
                encodeURIComponent(req.params.lesson)
            }/terminal?connection=${
                encodeURIComponent(req.query.connection)
            }`;

            if (processes.has(sessionId)) {
                const proc = processes.get(sessionId)!;
                if (connection.kind === "pty") {
                    proc.process.resize(cols, rows);
                }

                const proxy = proc.proxys.get(req.query.connection);
                if (proxy) {
                    return `http://${proxy.origin}.${hostname}:${port}`;
                }
                return wsUri;
            }

            if (service.kind !== "command") {
                throw new SafeError(500, "Service kind not supported");
            }

            const env = Object.assign({}, process.env as Record<string, string>);
            env['COLORTERM'] = 'truecolor';
            env["TERM"] = "xterm-256color";
            const term = pty.spawn(service.command ?? "bash", [], {
                name: 'xterm-256color',
                cols,
                rows,
                cwd: process.platform === 'win32' ? undefined : process.cwd(),
                env: env,
                encoding: 'utf8'
            });

            term.onExit(() => {
                deleteSession(sessionId)();
            })

            console.log('Created terminal for session: ' + sessionId);

            let uri = wsUri;
            const proxys = new Map<string, ProxyManager>();
            for (const conn of service.connections ?? []) {
                if (conn.kind === "http") {
                    const origin = `${uuid()}.proxy`;
                    proxys.set(conn.name, new ProxyManager(req.app, conn.port, origin));
                    console.log(origin);

                    if (conn.name === req.query.connection) {
                        uri = withSubdomain(req, origin).toString();
                    }
                }
            }

            const proc: ActiveService = {
                process: term,
                ptyLogs: "",
                sockets: new Map(),
                timeout: undefined,
                proxys,
            }
            processes.set(sessionId, proc);

            term.onData((d) => {
                proc.ptyLogs += d;
            });

            scheduleTermination(sessionId);

            return uri;
        })
    )

export const wsRouter = express.Router();

wsRouter.ws('/:module/:lesson/terminal', async (ws, req) => {
    marshal(req.params, M.obj({ module: M.str, lesson: M.str }));
    marshal(req.query, M.obj({ connection: M.str }));

    const moduleCache = await getModuleByPath(req.params.module);
    const service = moduleCache.services.find((s) => s.connections?.some((c) => c.name === req.query.connection));
    if (!service) {
        throw new SafeError(404, "Connection not found");
    }

    const connection = service.connections!.find((c) => c.name === req.query.connection);
    if (!connection) {
        throw new SafeError(404, "Connection not found");
    }

    const sessionId = `${req.params.module}/${service.name}`;

    const proc = processes.get(sessionId);
    if (!proc) {
        ws.send("Connection Not Found");
        ws.close();
        return;
    }

    const socketSet = proc.sockets.get(req.query.connection) ?? new Set();
    proc.sockets.set(req.query.connection, socketSet);
    socketSet.add(ws);

    clearTermination(sessionId);

    console.log('Connected to terminal ' + proc.process.pid);

    if (connection.kind === "pty") {
        ws.send(proc.ptyLogs);

        const bufferUtf8 = (socket: WebSocket, timeout: number) => {
            let buffer: Buffer[] = [];
            let sender: NodeJS.Timeout | null = null;
            return (data: string) => {
                buffer.push(Buffer.from(data, "utf-8"));
                if (!sender) {
                    sender = setTimeout(() => {
                        socket.send(Buffer.concat(buffer));
                        buffer = [];
                        sender = null;
                    }, timeout);
                }
            };
        }
        const send = bufferUtf8(ws, 5);

        const onDataHandler = proc.process.onData((data) => {
            try {
                send(data);
            } catch (ex) {
                // The WebSocket is not open, ignore
            }
        });

        ws.on('message', function(msg) {
            const msgAsBuffer =
                Array.isArray(msg) ? Buffer.concat(msg) :
                Buffer.from(msg as string, "utf-8");
            proc.process.write(msgAsBuffer.toString("utf-8"));
        });

        ws.on('close', function () {
            socketSet.delete(ws);
            onDataHandler.dispose();

            if (socketSet.size === 0) {
                scheduleTermination(sessionId);
            }
        });
    }
});
