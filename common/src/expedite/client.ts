import * as qs from "qs";

import type { Request } from "express";
import type { RouterScope, Method } from "./router";

type GetRoutes<T> = T extends RouterScope<any, any, infer R> ? R : never
type GetQuery<T> = T extends Request<any, any, any, infer Q> ? Q : undefined
type GetParams<T> = T extends Request<infer P, any, any, any> ? P : undefined
type GetBody<T> = T extends Request<any, any, infer B, any> ? B : undefined
type GetReturn<T> = T extends Request<any, infer R, any, any> ? R : undefined

type Optionalize<F> =
    F extends (q: infer Q | undefined, b: infer B | undefined, p: infer P | undefined) => infer R ? (q?: Q, b?: B, p?: P) => R :
    F extends (q: infer Q, b: infer B | undefined, p: infer P | undefined) => infer R ? (q: Q, b?: B, p?: P) => R :
    F extends (q: infer Q, b: infer B, p: infer P | undefined) => infer R ? (q: Q, b: B, p?: P) => R :
    F

type GetClient<R> = {
    [K in keyof R]: {
        [M in keyof R[K]]: Optionalize<
            (q: GetQuery<R[K][M]>, b: GetBody<R[K][M]>, p: GetParams<R[K][M]>) => Promise<GetReturn<R[K][M]>>
        >
    }
};


type Fn = (q: Record<string, any>, b: any, p: Record<string, string>) => Promise<any>;

export class HttpError extends Error {
    constructor(public code: number, public body: string) {
        super(`HTTP ERROR (${code}): ${body}`);
    }
}

export const makeClient = <T>(subpath: string = "") => (baseUri: string): GetClient<GetRoutes<T>> => {
    const base = new URL(baseUri);
    const methodProxy = (path: string) => {
        const url = new URL(subpath + path, base);
        if (url.origin !== base.origin) {
            throw new Error(`Unexpected origin passed to request. Got ${url.origin} but expected ${base.origin}`);
        }

        return new Proxy<Record<Method, Fn>>({} as any, {
            get(obj, method: Method) {
                // Might as well cache
                if (method in obj) return obj[method];

                return obj[method] = async (q, b, p) => {
                    const encodedQuery = qs.stringify(q);
                    url.search = encodedQuery;
                    url.pathname = url.pathname.replace(/:(\w+)\b/g, (_, param) => p[param] ?? "");

                    const req = await fetch(url.toString(), {
                        method,
                        body: b ? JSON.stringify(b) : undefined,
                        headers: b ? { "content-type": "application/json" } : undefined,
                        credentials: "include",
                    });

                    if (req.ok) {
                        return req.json();
                    } else {
                        const error = await req.text();
                        throw new HttpError(req.status, error);
                    }
                };
            }
        });
    }

    return new Proxy<Record<string, Record<Method, Fn>>>({} as any, {
        get(obj, url: string) {
            if (url in obj) return obj[url];

            return obj[url] = methodProxy(url);
        }
    }) as unknown as GetClient<GetRoutes<T>>;
};