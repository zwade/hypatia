import { M, Marshaller } from "@zensors/sheriff";

export namespace Command {
    export type t =
        | { kind: "command", command: string, args?: string[] }
        | { kind: "docker", image: string, command?: string }

    export const MCommand: Marshaller<t> = M.union(
        M.obj({ kind: M.lit("command"), command: M.str, args: M.opt(M.arr(M.str)) }),
        M.obj({ kind: M.lit("docker"), image: M.str, command: M.opt(M.str) })
    );
}