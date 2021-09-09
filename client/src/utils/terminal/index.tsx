type Events = {
    "finish": ((ws: WebSocket, sessionId: number) => void);
}

interface ApiTerminal {
    rows: number;
    cols: number;
    pid: number;
}

export class TerminalConnection {
    private ws: WebSocket | undefined;
    private cancelResize: (() => void) | undefined;

    public sessionId: number | null;
    public rows;
    public cols;

    private events: { [K in keyof Events]: Set<Events[K]> } = {
        finish: new Set(),
    }

    public constructor(sessionId: number | null, rows: number, cols: number) {
        this.sessionId = sessionId;
        this.rows = rows;
        this.cols = cols;
    }

    public async write(data: string) {
        this.ws?.send(data);
    }

    public async resize(rows: number, cols: number) {
        if (this.sessionId === null) return;
        this.cancelResize?.();

        const search = new URLSearchParams([
            ["rows", rows.toString()],
            ["cols", cols.toString()]
        ]).toString();
        const uri = `/api/terminals/${this.sessionId}/size?${search}`;

        const abortController = new AbortController();
        this.cancelResize = () => abortController.abort();

        const request = await fetch(uri, {
            method: "POST",
            signal: abortController.signal,
        });

        this.cancelResize = undefined;
    }

    public async queryTerminal() {
        if (this.sessionId === null) return null;

        const request = await fetch(`/api/terminals/${this.sessionId}`);
        const terminal: ApiTerminal | null = await request.json();

        return terminal;
    }

    public async connect() {
        const existingSession = await this.queryTerminal();
        let sessionId: number;

        if (existingSession !== null) {
            sessionId = existingSession.pid;
        } else {
            const request = await fetch(`/api/terminals?rows=${this.rows}&cols=${this.cols}`, {
                "method": "POST"
            });
            sessionId = await request.json();
        }

        this.resize(this.rows, this.cols);

        this.sessionId = sessionId;

        const wsUri = new URL(window.location.toString());
        wsUri.protocol = "ws";
        wsUri.pathname = "/ws-api/terminals/" + this.sessionId;
        const ws = new WebSocket(wsUri);
        this.ws = ws

        this.ws.onopen = () => {
            this.trigger("finish", ws, sessionId);
        }
    }


    private trigger<T extends keyof Events>(evt: T, ...args: Events[T] extends ((...args: infer A) => void) ? A : never) {
        for (const cb of this.events[evt]) {
            (cb as any)(...args)
        }
    }

    public on<T extends keyof Events>(evt: T, cb: Events[T]) {
        this.events[evt].add(cb);
    }

    public off<T extends keyof Events>(evt: T, cb: Events[T]) {
        return this.events[evt].delete(cb);
    }
}