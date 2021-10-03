import { M, Marshaller } from "@zensors/sheriff";

import { Service } from "./service"

export namespace View {
    export type Markdown = {
        kind: "markdown",
        fileName: string;
    }

    export type Terminal = {
        kind: "terminal",
        connection: string,
    }

    export type Http = {
        kind: "http",
        connection: string,
    }

    export type t = Markdown | Terminal | Http | [t, t];

    export const MMarkdown: Marshaller<Markdown> = M.obj({
        kind: M.lit("markdown"),
        fileName: M.str
    });

    export const MTerminal: Marshaller<Terminal> = M.obj({
        kind: M.lit("terminal"),
        connection: M.str,
    });

    export const MHttp: Marshaller<Http> = M.obj({
        kind: M.lit("http"),
        connection: M.str,
    });

    export const MView: Marshaller<t> = M.rec((self) =>
        M.union(
            MMarkdown,
            MTerminal,
            MHttp,
            M.tup(self, self)
        )
    );
}

export namespace Page {
    export type AsBundle = {
        name: string;
        view: View.t;
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
        lessons: Lesson.AsBundle[];
        services: Service.t[];
    }

    export type AsInline = {
        name?: string;
        lessons?: string[];
        services?: Service.t[];
    }

    export type AsWire = {
        name: string;
        path: string;
        lessons: Lesson.AsWire[];
        services: Service.t[];
    }

    export const MAsInline: Marshaller<AsInline> = M.obj({
        name: M.opt(M.str),
        lessons: M.opt(M.arr(M.str)),
        services: M.opt(M.arr(Service.MService)),
    });

    export const MAsBundle: Marshaller<AsBundle> = M.obj({
        name: M.str,
        lessons: M.arr(Lesson.MAsBundle),
        services: M.arr(Service.MService),
    });
}