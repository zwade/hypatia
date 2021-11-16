import { Expect, JsonSerializable } from "@hypatia-app/common";
import { M, Marshaller } from "@zensors/sheriff";

export namespace Quest {
    export type Language = "javascript" | "python";

    export type t = {
        name: string;
        instructions: string;
        templates: { [key in Language]?: string };
        tests: {
            name: string;
            description?: string;
            input: JsonSerializable.t[];
            expect: Expect.t;
        }[]
    };

    export const MQuest: Marshaller<t> = M.obj({
        name: M.str,
        instructions: M.str,
        templates: M.obj({
            javascript: M.opt(M.str),
            python: M.opt(M.str),
        }),
        tests: M.arr(M.obj({
            name: M.str,
            description: M.opt(M.str),
            input: M.arr(JsonSerializable.MJsonSerializable),
            expect: Expect.MExpect,
        }))
    });
}