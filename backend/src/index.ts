import * as expressWs from "express-ws";
import * as express from "express";
import * as http from "http";

import type { AppRouter } from "./routes";
import { wsOriginRouter, originRouter } from "./routes/utils";
import { ProxyTest, ProxyTestWs } from "./routes/proxy";
import { withSubdomain } from "./net-utils";

export const start = () => {
    const app = express();
    const server = http.createServer(app);

    wsOriginRouter(app, server);
    originRouter(app);
    expressWs(app, server);


    // We have to do this nonsense because of the way express-ws patches express
    const { AppRouter: appRouter }: { AppRouter: typeof AppRouter } = require("./routes");

    app.bindOrigin((req, res, next) => {
        const newUrl = withSubdomain(req, "app");
        res.redirect(newUrl.toString());
    })
    app.bindOrigin(appRouter.toExpress(), "app");
    app.bindOrigin(ProxyTest("http://localhost:3000"), "test");

    app.bindOriginWs(ProxyTestWs("http://localhost:3000"), "test");

    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    const host = process.env.HOST ?? '127.0.0.1';

    console.log(`App listening to http://${host}:${port}`);
    server.listen(port, host)
}

if (require.main === module) {
    start();
}

export * from "./routes";