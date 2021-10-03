import { moduleClient } from "@hypatia-app/backend/dist/client";

const client = moduleClient(window.location.href);

type Events = {
    "finish": ((ws: WebSocket) => void);
    "close": () => void;
}

export class TerminalConnection {
    private ws: WebSocket | undefined;
    private cancelResize: (() => void) | undefined;

    public module: string;
    public lesson: string;
    public connection: string;
    public rows;
    public cols;

    private events: { [K in keyof Events]: Set<Events[K]> } = {
        finish: new Set(),
        close: new Set(),
    }

    public constructor(module: string, lesson: string, connection: string, rows: number, cols: number) {
        this.connection = connection;
        this.module = module;
        this.lesson = lesson;
        this.rows = rows;
        this.cols = cols;
    }

    public async write(data: string) {
        this.ws?.send(data);
    }

    public async resize(rows: number, cols: number) {
        this.rows = rows;
        this.cols = cols;
        await this.upsertTerminal();
    }

    public async upsertTerminal() {
        const terminal = await client["/api/:module/:lesson/service"].post(
            { rows: this.rows.toString(), cols: this.cols.toString(), connection: this.connection },
            undefined,
            { module: this.module, lesson: this.lesson },
        );

        return terminal?.value;
    }

    public async connect() {
        const connectionUri = await this.upsertTerminal();

        const wsUri = new URL(connectionUri, window.location.href);
        wsUri.protocol = "ws";
        const ws = new WebSocket(wsUri);
        this.ws = ws

        this.ws.onclose = () => {
            this.trigger("close");
        }

        this.ws.onerror = () => {
            this.trigger("close");
        }

        this.ws.onopen = () => {
            this.trigger("finish", ws);
        }
    }


    private trigger<T extends keyof Events>(evt: T, ...args: Events[T] extends ((...args: infer A) => void) ? A : never) {
        for (const cb of this.events[evt]) {
            (cb as any)(...args)
        }
    }

    public on<T extends keyof Events>(evt: T, cb: Events[T]) {
        this.events[evt].add(cb as any);
    }

    public off<T extends keyof Events>(evt: T, cb: Events[T]) {
        return this.events[evt].delete(cb as any);
    }
}