/**
 * WARNING: This demo is a barebones implementation designed for development and evaluation
 * purposes only. It is definitely NOT production ready and does not aim to be so. Exposing the
 * demo to the public as is would introduce security risks for the host.
 **/

import * as express from "express";
import * as os from "os";
import * as pty from "node-pty";
import { marshalParams, marshalQuery, Router } from "@hypatia-app/common";
import { M, marshal } from "@zensors/sheriff";

import * as WebSocket from "ws";

// Whether to use binary transport.
const USE_BINARY = os.platform() !== "win32";


const terminals: Record<number, pty.IPty> = {};
const logs: Record<number, string> = {};
const timeouts: Record<number, NodeJS.Timeout> = {};
const sockets: Record<number, Set<WebSocket>> = {};

const deleteSession = (session: number) => () => {
    const term = terminals[session] as pty.IPty | undefined;

    try {
        term?.kill();
        console.log('Closed terminal ' + session);
    } catch {
        // pass
    }

    for (const socket of sockets[session] ?? []) {
        try {
            socket.close();
        } catch {
            // pass
        }
    }

    // Clean things up
    delete terminals[session];
    delete logs[session];
    delete sockets[session];
}

const clearTermination = (session: number) => {
    if (session in timeouts) {
        clearTimeout(timeouts[session]);
    }
}

const scheduleTermination = (session: number, timeout = 30 * 60 * 1000) => {
    clearTermination(session);
    timeouts[session] = setTimeout(deleteSession(session), timeout);
}


export const apiRouter = Router()
    .post("/terminals", (leaf) => leaf
        .then(marshalQuery(M.obj({ cols: M.str, rows: M.str })))
        .return((req) => {
            const env = Object.assign({}, process.env as Record<string, string>);
            env['COLORTERM'] = 'truecolor';
            const cols = parseInt(req.query.cols, 10);
            const rows = parseInt(req.query.rows, 10);
            const term = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
                name: 'xterm-256color',
                cols: cols || 80,
                rows: rows || 24,
                cwd: process.platform === 'win32' ? undefined : env.PWD,
                env: env,
                encoding: USE_BINARY ? null : 'utf8'
            });

            const pid = term.pid
            term.onExit(() => {
                deleteSession(pid)();
            })

            console.log('Created terminal with PID: ' + term.pid);
            terminals[term.pid] = term;
            logs[term.pid] = '';
            term.on('data', function(data) {
                logs[term.pid] += data;
            });
            scheduleTermination(term.pid);

            return term.pid;
        })
    )
    .get("/terminals/:pid/", (leaf) => leaf
        .then(marshalParams(M.obj({ pid: M.str })))
        .return((req) => {
            const pid = parseInt(req.params.pid, 10);

            const term = terminals[pid];
            if (term === undefined) {
                return null;
            } else {
                return {
                    pid,
                    row: term.rows,
                    cols: term.cols,
                };
            }
        })
    )
    .post("/terminals/:pid/size", (leaf) => leaf
        .then(marshalParams(M.obj({ pid: M.str })))
        .then(marshalQuery(M.obj({ cols: M.str, rows: M.str })))
        .return((req) => {
            const pid = parseInt(req.params.pid);
            const cols = parseInt(req.query.cols);
            const rows = parseInt(req.query.rows);
            const term = terminals[pid];

            term.resize(cols, rows);
            console.log('Resized terminal ' + pid + ' to ' + cols + ' cols and ' + rows + ' rows.');
            return true;
        })
    )

export const wsRouter = express.Router();

wsRouter.ws('/terminals/:pid', function (ws, req) {
    const pid = parseInt(req.params.pid, 10);
    if (isNaN(pid)) {
        ws.send("Invalid terminal pid");
        return;
    }

    const socketSet = sockets[pid] ??= new Set();
    socketSet.add(ws);

    const term = terminals[pid];
    if (term === undefined) {
        ws.send("Connection Closed\n");
        return;
    }

    clearTermination(pid);

    console.log('Connected to terminal ' + term.pid);
    ws.send(logs[term.pid]);

    // string message buffering
    function buffer(socket: WebSocket, timeout: number) {
        let s = '';
        let sender: NodeJS.Timeout | null = null;
        return (data: string) => {
            s += data;
            if (!sender) {
                sender = setTimeout(() => {
                    socket.send(s);
                    s = '';
                    sender = null;
                }, timeout);
            }
        };
    }
    // binary message buffering
    function bufferUtf8(socket: WebSocket, timeout: number) {
        let buffer: Buffer[] = [];
        let sender: NodeJS.Timeout | null = null;
        let length = 0;
        return (data: string) => {
            buffer.push(Buffer.from(data, "utf-8"));
            length += data.length;
            if (!sender) {
                sender = setTimeout(() => {
                    socket.send(Buffer.concat(buffer, length));
                    buffer = [];
                    sender = null;
                    length = 0;
                }, timeout);
            }
        };
    }
    const send = USE_BINARY ? bufferUtf8(ws, 5) : buffer(ws, 5);

    term.onData(function(data) {
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
        term.write(msgAsBuffer.toString("utf-8"));
    });
    ws.on('close', function () {
        socketSet.delete(ws);
        if (socketSet.size === 0) {
            scheduleTermination(term.pid);
        }
    });
});
