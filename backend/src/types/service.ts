import { M, Marshaller } from "@zensors/sheriff";

export namespace Connection {
    export type Pty = {
        kind: "pty";
        name: string;
    }

    export type Socket = {
        kind: "socket";
        name: string;
        port: number;
    }

    export type Http = {
        kind: "http";
        name: string;
        port: number;
    }

    export type t = Pty | Socket | Http;

    export const MPty: Marshaller<Pty> = M.obj({
        kind: M.lit("pty"),
        name: M.str,
    });

    export const MSocket: Marshaller<Socket> = M.obj({
        kind: M.lit("socket"),
        name: M.str,
        port: M.num,
    });

    export const MHttp: Marshaller<Http> = M.obj({
        kind: M.lit("http"),
        name: M.str,
        port: M.num,
    });

    export const MConnection: Marshaller<t> = M.union(MPty, MSocket, MHttp);
}

export namespace Service {
    export type t = (
        | {
            kind: "command",
            command: string,
            args?: string[],
        }
        | {
            kind: "docker",
            image: string,
            command?: string[],
        }
    ) & {
        name: string;
        connections?: Connection.t[];
        requests?: string[];
    }

    const common = {
        name: M.str,
        connections: M.opt(M.arr(Connection.MConnection)),
        requests: M.opt(M.arr(M.str)),
    };

    export const MService: Marshaller<t> = M.union(
        M.obj({
            ...common,
            kind: M.lit("command"),
            command: M.str,
            args: M.opt(M.arr(M.str)),
        }),
        M.obj({
            ...common,
            kind: M.lit("docker"),
            image: M.str,
            command: M.opt(M.arr(M.str)),
        })
    );
}