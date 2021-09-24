import * as expressWs from "express-ws";
import * as express from "express";

import type { AppRouter } from "./routes";

export const start = () => {
    const expressApp = express();
    const { app } = expressWs(expressApp);

    // We have to do this nonsense because of the way express-ws patches express
    const { AppRouter: appRouter }: { AppRouter: typeof AppRouter } = require("./routes");

    app.use("/", appRouter.toExpress());

    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    const host = process.env.HOST ?? '127.0.0.1';

    console.log(`App listening to http://${host}:${port}`);
    app.listen(port, host);
}

if (require.main === module) {
    start();
}

export * from "./routes";