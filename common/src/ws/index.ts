import type * as WebSocket from 'ws';

import { Queue } from "../queue";

export class ProtocolWebSocket<Tx, Rx> {
    public queue;

    private ws;
    private buffer: Buffer = Buffer.from([]);

    constructor(ws: WebSocket) {
        this.ws = ws;
        this.queue = new Queue<Rx, Error | undefined>();

        this.ws.addEventListener("message", (ev) => {
            this.buffer = Buffer.concat([this.buffer, Buffer.from(ev.data)]);

            while (true) {
                const newlineIndex = this.buffer.indexOf(10);
                if (newlineIndex < 0) break;

                const prefix = this.buffer.slice(0, newlineIndex).toString("utf-8");
                this.queue.push(JSON.parse(prefix) as Rx);
                this.buffer = this.buffer.slice(newlineIndex + 1);
            }
        });

        this.ws.addEventListener("error", (ev) => {
            console.error("Websocket error", ev);
            this.queue.close(new Error("Websocket failed"));
        });

        this.ws.addEventListener("close", (ev) => {
            this.queue.close();
        });
    }

    public send(tx: Tx): void {
        const msg = JSON.stringify(tx);
        if (msg.includes("\n")) {
            throw new Error("Stringified JSON may not have newlines");
        }
        this.ws.send(JSON.stringify(tx) + "\n");
    }
}