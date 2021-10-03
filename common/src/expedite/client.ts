import * as qs from "qs";

import type { Request } from "express";
import type { RouterScope, Method } from "./router";
import { CancelablePromise, Loadable } from "../data";

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
            (q: GetQuery<R[K][M]>, b: GetBody<R[K][M]>, p: GetParams<R[K][M]>) => Loadable.Loading<GetReturn<R[K][M]>>
        >
    }
};


type Fn = (q: Record<string, any>, b: any, p: Record<string, string>) => Loadable.Loading<any>;

export class HttpError extends Error {
    constructor(public code: number, public body: string) {
        super(`HTTP ERROR (${code}): ${body}`);
    }
}

export const makeClient = <T>(subpath: string = "") => (baseUri: string): GetClient<GetRoutes<T>> => {
    const base = new URL(baseUri);
    const methodProxy = (path: string) => {
        const endpointUrl = new URL(subpath + path, base);
        if (endpointUrl.origin !== base.origin) {
            throw new Error(`Unexpected origin passed to request. Got ${endpointUrl.origin} but expected ${base.origin}`);
        }

        return new Proxy<Record<Method, Fn>>({} as any, {
            get(obj, method: Method) {
                // Might as well cache
                if (method in obj) return obj[method];

                return obj[method] = (q, b, p) => {
                    const thunk = () => {
                        const url = new URL(endpointUrl);
                        const encodedQuery = qs.stringify(q);
                        url.search = encodedQuery;
                        url.pathname = url.pathname.replace(/:(\w+)\b/g, (_, param) => p[param] ?? "");

                        return new CancelablePromise(async (resolve, reject, addOnCancel) => {
                            const abortController = (
                                "AbortController" in globalThis ? new AbortController() : undefined
                            );

                            const req = await fetch(url.toString(), {
                                method,
                                body: b ? JSON.stringify(b) : undefined,
                                headers: b ? { "content-type": "application/json" } : undefined,
                                credentials: "include",
                                signal: abortController?.signal,
                            });

                            addOnCancel(() => abortController?.abort());

                            if (req.ok) {
                                resolve(req.json());
                            } else {
                                const error = await req.text();
                                reject(new HttpError(req.status, error));
                            }
                        })
                    };

                    return Loadable.loading(thunk);
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