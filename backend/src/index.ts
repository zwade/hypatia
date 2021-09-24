import * as expressWs from "express-ws";
import * as express from "express";

const expressApp = express();
const { app } = expressWs(expressApp);

import { AppRouter } from "./routes";

app.use("/", AppRouter.toExpress());

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const host = process.env.HOST ?? '127.0.0.1';

console.log(`App listening to http://${host}:${port}`);
app.listen(port, host);