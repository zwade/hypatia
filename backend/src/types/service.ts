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
    export type t =
        | {
            kind: "command",
            name: string,
            command: string,
            args?: string[],
            connections?: Connection.t[],
        }
        | {
            kind: "docker",
            name: string,
            image: string,
            command?: string,
            connections?: Connection.t[],
        }

    const MPorts = M.custom(M.record(Connection.MSocket), (ports) => {
        if (Object.keys(ports).some((p) => (isNaN as (p: number | string) => boolean)(p))) {
            throw new Error("Ports must be numbers");
        }
    });

    export const MService: Marshaller<t> = M.union(
        M.obj({
            kind: M.lit("command"),
            name: M.str,
            command: M.str,
            args: M.opt(M.arr(M.str)),
            connections: M.opt(M.arr(Connection.MConnection)),
        }),
        M.obj({
            kind: M.lit("docker"),
            name: M.str,
            image: M.str,
            command: M.opt(M.str),
            connections: M.opt(M.arr(Connection.MConnection)),
        })
    );
}