import * as http from "http";
import * as internal from "stream";
import { Request, Response, NextFunction, Application } from "express";
import * as proxy from "http-proxy";

const ProxyServer = proxy.createProxyServer({});
ProxyServer.on("error", (err) => {
    console.error(err);
})

export class ProxyManager {
    public app;
    public port;
    public origin;
    public kill;

    public constructor(app: Application, port: number, origin: string) {
        this.app = app;
        this.port = port;
        this.origin = origin;

        const cancel = app.bindOrigin(ProxyTest(`http://localhost:${port}`), origin)
        const cancelWs = app.bindOriginWs(ProxyTestWs(`http://localhost:${port}`), origin);

        this.kill = () => {
            cancel();
            cancelWs();
        }
    }
}

export const ProxyTestWs = (target: string) => (req: http.IncomingMessage, socket: internal.Duplex, head: Buffer) => {
    return ProxyServer.ws(req, socket, head, { target });
}

export const ProxyTest = (target: string) => (req: Request, res: Response, next: NextFunction) => {
    return ProxyServer.web(req, res, { target });
}