import * as React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { PaletteProvider, ModalProvider } from "react-pwn";

import { ModuleProvider } from "../../providers/module-provider";
import { Divider } from "../divider"
import { ModuleBrowser } from "../module-browser";
import { Terminal } from "../terminal"
import { Page } from "../page";
import { TerminalRunProvider } from "../../providers/terminal-run";
import { BlueGreen } from "../../utils/palette";
import { AppContainer } from "../app-container";
import { SettingsContext, SettingsProvider } from "../../providers/settings-provider";

import "./index.scss";

const Pages = () => (
    <Router>
        <Switch>
            <Route exact path="/" component={ModuleBrowser} />
            <Route exact path="/:module/:lesson/:page" component={Page} />
        </Switch>
    </Router>
);

const Content = () => {
    const { settings } = React.useContext(SettingsContext)

    return (
        <Divider
            vertical={settings.vertical}
            firstChild={<Pages/>}
            secondChild={<Terminal/>}
        />
    );
}

export const App = () => {
    return (
        <TerminalRunProvider>
            <ModuleProvider>
                <PaletteProvider palette={BlueGreen}>
                    <SettingsProvider>
                        <ModalProvider>
                            <AppContainer>
                                <Content/>
                            </AppContainer>
                        </ModalProvider>
                    </SettingsProvider>
                </PaletteProvider>
            </ModuleProvider>
        </TerminalRunProvider>
    );
}