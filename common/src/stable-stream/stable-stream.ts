import type * as net from "net";
import type * as WebSocket from "ws";

import { TypedEventEmitter } from "../typed-event-emitter";

export type GenericStream<Tx, Rx, WriteFunction extends string, CloseFunction extends string, DataEvent extends string, CloseEvent extends string> = {
    on(e: DataEvent, cb: (data: Tx) => void): void;
    on(e: CloseEvent, cb: () => void): void;

    off(e: DataEvent, cb: (data: Tx) => void): void;
    off(e: CloseEvent, cb: () => void): void;
} & {
    [K in WriteFunction]: (data: Rx) => void;
} & {
    [K in CloseFunction]: () => void;
}

interface Events<T> {
    close: [];
    drain: [T];
}

export class StableStream<
    Tx,
    Rx,
    TxRaw = any,
    WriteFunction extends string = any,
    CloseFunction extends string = any,
    DataEvent extends string = any,
    CloseEvent extends string = any,
> extends TypedEventEmitter<"drain" | "close", Events<Tx>>  {
    private baseStream;
    private writeFn;
    private closeFn;
    private dataEvt;
    private closeEvt;
    private mapper;

    private buffer: Tx[] = [];
    private destination: {
        stream: StableStream<any, Tx>;
        destroyOnClose: boolean
    } | null = null

    public static fromSocket = (s: net.Socket) => {
        const baseDestroy = s.destroy.bind(s);
        // Socket hard destroy doesn't emit a close event, just an end event ;_;
        // And socket.end isn't guaranteed to actually close the socket
        s.on("end", () => {
            s.emit("close");
        })

        return new StableStream<Buffer, Buffer, Buffer, "write", "destroy", "data", "close">(
            s,
            (data) => data,
            "write",
            "destroy",
            "data",
            "close"
        );
    }

    public static fromWebSocket = (ws: WebSocket) => {
        return new StableStream<Buffer, Buffer, Buffer, "send", "close", "message", "close">(
            ws,
            (data) => data,
            "send",
            "close",
            "message",
            "close"
        );
    }

    constructor(
        baseStream: GenericStream<TxRaw, Rx, WriteFunction, CloseFunction, DataEvent, CloseEvent>,
        mapper: (data: TxRaw) => Tx,
        writeFn: WriteFunction,
        closeFn: CloseFunction,
        dataEvt: DataEvent,
        closeEvt: CloseEvent
    ) {
        super();

        this.mapper = mapper;
        this.baseStream = baseStream;
        this.writeFn = writeFn;
        this.closeFn = closeFn;
        this.dataEvt = dataEvt;
        this.closeEvt = closeEvt;

        this.onWrite = this.onWrite.bind(this);
        this.onClose = this.onClose.bind(this);

        baseStream.on(dataEvt, this.onWrite);
        baseStream.on(closeEvt, this.onClose);
    }

    private onWrite(data: TxRaw) {
        if (this.destination !== null) {
            this.destination.stream.write(this.mapper(data));
        } else {
            this.buffer.push(this.mapper(data));
        }
    }

    private onClose() {
        this.baseStream.off(this.dataEvt, this.onWrite);
        this.baseStream.off(this.closeEvt, this.onClose);

        if (this.buffer.length > 0) {
            for (const data of this.buffer) {
                this.emit("drain", data);
            }
            this.buffer = [];
        }

        if (this.destination?.destroyOnClose) {
            this.destination.stream.close();
        }

        this.emit("close");
    }

    public write(data: Rx) {
        this.baseStream[this.writeFn](data);
    }

    public close() {
        this.baseStream[this.closeFn]();
    }

    public bind(stream: StableStream<any, Tx>, destroyOnClose = false) {
        if (this.destination !== null) {
            throw new Error("Stream already bound");
        }

        this.destination = {
            stream,
            destroyOnClose
        };

        if (this.buffer.length > 0) {
            for (const data of this.buffer) {
               stream.write(data);
            }
            this.buffer = [];
        }

        const downstreamClose = () => {
            this.destination = null;
            stream.off("close", downstreamClose);
        }

        stream.on("close", downstreamClose);
    }
}