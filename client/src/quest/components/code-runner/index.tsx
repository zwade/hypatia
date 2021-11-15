import * as React from "react";

import { runPython } from "../../utils/run-python";
import { FileContext } from "../../providers/file-provider";
import { runJavascript } from "../../utils/run-javascript";
import { Test, TestHandler } from "./test-handler";

import "./index.scss";

export interface Props {
    name: string;
    instructions: string;
    tests: Test[];
}

export const CodeRunner = (props: Props) => {
    const { files, selected } = React.useContext(FileContext);

    if (!selected) {
        return <div>No file selected</div>
    }

    const compile = () => {
        let fn: ((...args: unknown[]) => void) | undefined;
        if (selected === "python") {
            fn = runPython(files.get(selected)!, "result");
        } else {
            fn = runJavascript(files.get(selected)!, "result");
        }

        if (typeof fn !== "function") {
            throw new Error(`Was expecting function, got ${fn}`);
        }

        if (selected === "javascript") {
            return fn;
        } else {
            return async (...args: unknown[]) => {
                try {
                    return await __BRYTHON__.promise(fn!(...args));
                } catch (err) {
                    if (!(err instanceof Error)) {
                        throw new Error(`Was expecting Error, got ${err}`);
                    }

                    throw new Error(__BRYTHON__.$getattr(err, "info"));
                }
            };
        }
    }

    return (
        <TestHandler
            compile={compile}
            tests={props.tests}
            instructions={props.instructions}
            name={props.name}
        />
    );
}