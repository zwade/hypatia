import * as React from "react";
import { Map as IMap } from "immutable";
import { render } from "react-dom"
import { PaletteProvider } from "react-pwn";
import { Loadable } from "@hypatia-app/common";
import type { Quest } from "@hypatia-app/backend/dist/types";

import { BlueGreen } from "../main/utils/palette";
import { MultiEditor } from "./components/multi-editor";
import { FileProvider } from "./providers/file-provider";
import { CodeRunner } from "./components/code-runner";
import { useLoadable } from "../main/hooks";
import { API } from "./api";
import { MessageContext, MessageProvider } from "./providers/message-provider";

import "./index.scss";
import "./load-brython";

const waitingForApp = Symbol("Waiting for App");

const _App = () => {
    const { configuration } = React.useContext(MessageContext);
    const [loadable] = useLoadable<Quest.t>(() => {
        if (configuration !== undefined) {
            const { module, lesson, file, signature } = configuration;
            return API.Modules.getSignedQuest(module, lesson, file, signature)
        }

        return Loadable.unrecoverableError(waitingForApp);
    }, [configuration]);

    if (!loadable.value) {
        if (loadable.loading || loadable.error === waitingForApp) {
            return (
                <div className="loading">
                    Loading
                </div>
            );
        } else {
            return (
                <div className="error">
                    Something went wrong
                </div>
            );
        }
    }

    const data = loadable.value;

    return (
        <PaletteProvider palette={BlueGreen}>
            <FileProvider templates={IMap(data.templates)}>
                <div className="quest-app">
                    <MultiEditor/>
                    <CodeRunner
                        name={data.name}
                        instructions={data.instructions}
                        tests={data.tests}
                    />
                </div>
            </FileProvider>
        </PaletteProvider>
    );
}

const App = () => {
    return (
        <MessageProvider>
            <_App/>
        </MessageProvider>
    )
};

render(<App/>, document.getElementById("root"))