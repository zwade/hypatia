import type { Request } from "express";
export * from "./trie"

export const hostname = process.env.HOSTNAME ?? "localhost";
export const port = parseInt(process.env.PORT ?? "3001");

export const withSubdomain = (req: Request, subdomain: string, baseHost = hostname) => {
        const host = req.headers.host ?? "localhost";
        const newURL = new URL(req.url, "http://" + host)
        newURL.hostname = `${subdomain}.${baseHost}`;
        return newURL;
}
