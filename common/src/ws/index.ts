import e = require('express');
import type * as WebSocket from 'ws';

import { Queue } from "../queue";

export class ProtocolWebSocket<Tx, Rx> {
    public queue;

    private outgoingQueue;
    private ws;
    private buffer: Buffer = Buffer.from([]);
    private closeHandlers = new Set<() => void>();
    private onOpen?: () => void;
    private onError?: (err: any) => void;

    public ready: Promise<void>;

    constructor(ws: WebSocket) {
        this.ws = ws;
        this.queue = new Queue<Rx, Error | undefined>();
        this.outgoingQueue = new Queue<Tx>();

        this.ready = new Promise<void>((resolve, reject) => {
            this.onOpen = () => {
                resolve();
                this.onOpen = undefined;
                this.onError = undefined;
            };
            this.onError = (err) => {
                reject(err);
                this.onOpen = undefined;
                this.onError = undefined;
            }
        });

        this.ws.addEventListener("message", (ev) => {
            this.buffer = Buffer.concat([this.buffer, Buffer.from(ev.data)]);

            while (true) {
                const newlineIndex = this.buffer.indexOf(10);
                if (newlineIndex < 0) break;

                const prefix = this.buffer.slice(0, newlineIndex).toString("utf-8");
                console.log("Receiving", JSON.parse(prefix));
                this.queue.push(JSON.parse(prefix) as Rx);
                this.buffer = this.buffer.slice(newlineIndex + 1);
            }
        });

        this.ws.addEventListener("error", (ev) => {
            this.onError?.(ev);
            this.queue.close(new Error("Websocket failed"));
        });

        this.ws.addEventListener("close", (ev) => {
            if (!this.queue.closed) {
                this.queue.close();
            }
            this.emit("close");
        });

        const onOpen = async () => {
            this.onOpen?.();
            for await (const tx of this.outgoingQueue) {
                console.log("Sending", tx);
                const msg = JSON.stringify(tx);
                if (msg.includes("\n")) {
                    throw new Error("Stringified JSON may not have newlines");
                }
                this.ws.send(JSON.stringify(tx) + "\n");
            }
        }

        if (this.ws.readyState === this.ws.OPEN) {
            onOpen();
        } else {
            this.ws.on("open", onOpen);
        }
    }

    public send(tx: Tx): void {
        this.outgoingQueue.push(tx);
    }

    public emit(_ev: "close") {
        this.closeHandlers.forEach((cb) => cb());
    }

    public on(_ev: "close", cb: () => void) {
        this.closeHandlers.add(cb);

        return () => {
            this.closeHandlers.delete(cb);
        }
    }
}