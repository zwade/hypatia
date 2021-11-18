import "./patch";

import * as expressWs from "express-ws";
import * as express from "express";
import * as http from "http";
import * as yargs from "yargs";
import * as path from "path";
import * as bodyParser from "body-parser";

import { AppRouter } from "./routes";
import { wsOriginRouter, originRouter } from "./net-utils";
import { setOptions } from "./options";
import { bundle as bundleFn } from "./modules";

const legacyModules = (process.env.MODULE ?? "ALL").split(/,\s*/);

const baseBuilder = (yargs: yargs.Argv<{}>) => yargs
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

type BaseArgs = (typeof baseBuilder) extends yargs.CommandBuilder<any, infer U> ? yargs.Arguments<U> : never;

export const bundleBuilder = (yargs: yargs.Argv<{}>) => yargs
    .positional("module", {
        type: "string",
    })
    .positional("output", {
        alias: "o",
        type: "string",
        default: "bundle.zip",
    });

type BundleArgs = (typeof bundleBuilder) extends yargs.CommandBuilder<any, infer U> ? yargs.Arguments<U> : never;

export const parseArgs = () => {
    return (yargs
        .scriptName("hypatia")
        .command({
            command: "$0 [args]",
            aliases: ["serve"],
            builder: baseBuilder,
            handler: (args) => serve(args),
        })
        .command({
            command: "bundle <module> [args]",
            builder: bundleBuilder,
            handler: bundle,
        })
        .help()
        .argv
    )
}

export const serve = async (args: BaseArgs) => {
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

    app.use(bodyParser.json());

    wsOriginRouter(app, server);
    originRouter(app);
    expressWs(app, server);

    app.bindOrigin(AppRouter.toExpress());

    console.log(`App listening to http://${host}:${port}`);
    server.listen(port, host)
}

export const bundle = async (args: BundleArgs) => {
    await bundleFn(args.module!, args.output);
}

if (require.main === module) {
    parseArgs();
}