import "./patch";

import * as expressWs from "express-ws";
import * as express from "express";
import * as http from "http";
import * as yargs from "yargs";
import * as path from "path";

import { AppRouter } from "./routes";
import { wsOriginRouter, originRouter } from "./net-utils";
import { setOptions } from "./options";

const legacyModules = (process.env.MODULE ?? "ALL").split(/,\s*/);

export const parseArgs = () => {
    return (yargs
        .scriptName("hypatia")
        .usage("$0 [args]")
        .array("enable")
        .positional("enable", {
            array: true,
            type: "string",
            alias: "e",
            description: "Which modules to enable",
        })
        .positional("modules", {
            type: "string",
            alias: "m",
            description: "The directory containing the modules (defaults to $PWD/modules)",
        })
        .positional("cwd", {
            type: "string",
            description: "Set the current working directory"
        })
        .positional("port", {
            type: "number",
            alias: "p",
            description: "The port to listen on",
            default: 3001
        })
        .positional("host", {
            type: "string",
            alias: "h",
            description: "The host to listen on",
            default: "localhost"
        })
        .help()
        .argv
    )
}

export const start = async () => {
    const args = await parseArgs();

    const initialCwd = process.cwd();

    if (args.cwd !== undefined) {
        process.chdir(path.resolve(initialCwd, args.cwd));
    }

    const enabledModules = args.enable ?? legacyModules;
    const moduleDir =
        args.modules ? path.resolve(initialCwd, args.modules) :
        path.join(process.cwd(), "modules");
    const port = args.port;
    const host = args.host;

    const options = { enabledModules, moduleDir };
    setOptions(options);

    const app = express();
    const server = http.createServer(app);

    wsOriginRouter(app, server);
    originRouter(app);
    expressWs(app, server);

    app.bindOrigin(AppRouter.toExpress());

    console.log(`App listening to http://${host}:${port}`);
    server.listen(port, host)
}

if (require.main === module) {
    start();
}