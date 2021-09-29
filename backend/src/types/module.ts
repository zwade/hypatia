import { M, Marshaller } from "@zensors/sheriff";

import { Command } from "./command"

export namespace View {
    export type Markdown = {
        kind: "markdown",
        fileName: string;
    }

    export type Terminal = {
        kind: "terminal",
        command: Command.t,
        requests?: {
            features?: string[];
        }
    }

    export type t = Markdown | Terminal | [t, t];

    export const MMarkdown: Marshaller<Markdown> = M.obj({
        kind: M.lit("markdown"),
        fileName: M.str
    });

    export const MTerminal: Marshaller<Terminal> = M.obj({
        kind: M.lit("terminal"),
        command: Command.MCommand,
        requests: M.opt(M.obj({
            features: M.opt(M.arr(M.str))
        }))
    });

    export const MView: Marshaller<t> = M.rec((self) =>
        M.union(
            MMarkdown,
            MTerminal,
            M.tup(self, self)
        )
    );
}

export namespace Page {
    export type AsBundle = {
        name: string;
        view: View.t
    }

    export type AsInline = {
        name?: string;
        additionalView?: View.t
    }

    export type AsWire = {
        name: string;
        path: string;
        view: View.t;
    }

    export const MAsInline: Marshaller<AsInline> = M.obj({
        name: M.opt(M.str),
        additionalView: M.opt(View.MView),
    });

    export const MAsBundle: Marshaller<AsBundle> = M.obj({
        name: M.str,
        view: View.MView,
    });
}

export namespace Lesson {
    export type AsBundle = {
        name: string;
        pages: Page.AsBundle[]
    }

    export type AsInline = {
        name?: string;
        pages?: string[];
    }

    export type AsWire = {
        name: string;
        path: string;
        pages: { path: string }[];
    }

    export const MAsInline: Marshaller<AsInline> = M.obj({
        name: M.opt(M.str),
        pages: M.opt(M.arr(M.str)),
    });

    export const MAsBundle: Marshaller<AsBundle> = M.obj({
        name: M.str,
        pages: M.arr(Page.MAsBundle)
    });
}

export namespace Module {
    export type AsBundle = {
        name: string;
        lessons: Lesson.AsBundle[]
    }

    export type AsInline = {
        name?: string;
        lessons?: string[];
    }

    export type AsWire = {
        name: string;
        path: string;
        lessons: Lesson.AsWire[];
    }

    export const MAsInline: Marshaller<AsInline> = M.obj({
        name: M.opt(M.str),
        lessons: M.opt(M.arr(M.str)),
    });

    export const MAsBundle: Marshaller<AsBundle> = M.obj({
        name: M.str,
        lessons: M.arr(Lesson.MAsBundle),
    });
}