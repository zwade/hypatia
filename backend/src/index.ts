import * as expressWs from "express-ws";
import * as express from "express";
import * as os from "os";

const expressApp = express();
const { app } = expressWs(expressApp);

import { baseRouter, apiRouter, moduleRouter, wsRouter } from "./routes";

app.use("/api/", apiRouter);
// We need this on a different top level path for webpack proxy
app.use("/ws-api/", wsRouter);
app.use("/modules/", moduleRouter);

// Has the catch-all route
app.use("/", baseRouter);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const host = process.env.HOST ?? '127.0.0.1';

console.log(`App listening to http://${host}:${port}`);
app.listen(port, host);