import * as http from "http";
import * as internal from "stream";
import * as express from "express";

import { hostname, Trie } from "../net-utils";
import { SafeError } from "@hypatia-app/common";

export type UpgradeHandler = (req: http.IncomingMessage, socket: internal.Duplex, head: Buffer) => void;

declare module "express-serve-static-core" {
    export interface Application {
        bindOrigin(handler: express.Handler, origin?: string): () => void;
        bindOriginWs(handler: UpgradeHandler, origin?: string): () => void;
    }
}

export const get3LD = (req: http.IncomingMessage) => {
    const host = req.headers.host ?? "localhost";
    const origin = new URL("http://" + host).hostname;
    if (!origin.endsWith(`.${hostname}`)) {
        return null
    }

    return origin.slice(0, -(hostname.length + 1)).split(".").reverse();
}

export const splitDomain = (origin: string) => {
    return origin.split(".").reverse().filter((x) => x !== "");
}

export const wsOriginRouter = (app: express.Application, server: http.Server) => {
    const _addEventListener = server.addListener.bind(server);

    const handlerTrie = new Trie<Set<UpgradeHandler>>(new Set());

    function addEventListener(ev: "upgrade", handler: UpgradeHandler): http.Server;
    function addEventListener(ev: string, handler: (...args: any[]) => void): http.Server;
    function addEventListener(ev: string, handler: (...args: any[]) => void) {
        if (ev === "upgrade") {
            // pass
            const handlers = handlerTrie.find([])
            handlers.add(handler);
            return server;
        }
        return _addEventListener(ev, handler);
    }

    server.addListener = addEventListener;
    server.on = addEventListener;

    _addEventListener("upgrade", (req, socket, head) => {
        const origin = get3LD(req) ?? [];
        const handlers = handlerTrie.find(origin);

        for (const handler of handlers) {
            handler(req, socket, head);
        }
    });

    app.bindOriginWs = (handler: UpgradeHandler, originStr: string = "") => {
        const origin = splitDomain(originStr);
        const handlers = handlerTrie.find(origin, true) ?? new Set();
        handlerTrie.add(origin, handlers);
        handlers.add(handler);
        return () => handlers.delete(handler);
    }
}

export const originRouter = (app: express.Application) => {
    const handlerTrie = new Trie<express.Handler>((req, res) => { throw new SafeError(404, "Page not found") });

    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        const subdomain = get3LD(req) ?? [];
        const handler = handlerTrie.find(subdomain);
        handler(req, res, next);
    });

    app.bindOrigin = (handler: express.Handler, originStr = "") => {
        const origin = splitDomain(originStr);
        handlerTrie.add(origin, handler);
        return () => handlerTrie.delete(origin);
    }
}