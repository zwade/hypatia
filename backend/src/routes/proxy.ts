import * as http from "http";
import * as internal from "stream";
import { Request, Response, NextFunction, Application } from "express";
import * as proxy from "http-proxy";
import { splitDomain } from "./utils";

const ProxyServer = proxy.createProxyServer({});

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
    console.log("hit upgrade path");
    return ProxyServer.ws(req, socket, head, { target });
}

class SillyAgent extends http.Agent {
    public createConnection(options: any, callback: (err: unknown, socket: any) => void) {
        const socket = new internal.Duplex({
            read(d) {
                console.log(d.toString())
                this.push(`
HTTP/1.1 200 Ok\r
Content-Length: 11\r
Content-Type: text/html\r
\r
Hello World`);
                this.push(null);
            },
            write(d) {
                console.log(d.toString())
            }
        });
        callback(null, socket)
    }
}

export const ProxyTest = (target: string) => (req: Request, res: Response, next: NextFunction) => {
    return ProxyServer.web(req, res, { target });
}