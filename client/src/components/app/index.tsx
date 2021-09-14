import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { PaletteProvider } from "react-pwn";

import { ModuleProvider } from "../../providers/module-provider";
import { Divider } from "../divider"
import { ModuleBrowser } from "../module-browser";
import { Terminal } from "../terminal"
import { Page } from "../page";
import { TerminalRunProvider } from "../../providers/terminal-run";
import { BlueGreen } from "../../utils/palette";

import "./index.scss";
import { AppContainer } from "../app-container";

const Pages = () => (
    <Router>
        <Switch>
            <Route exact path="/" component={ModuleBrowser} />
            <Route exact path="/:module/:lesson/:page" component={Page} />
        </Switch>
    </Router>
);

export const App = () => {
    return (
        <TerminalRunProvider>
            <ModuleProvider>
                <PaletteProvider palette={BlueGreen}>
                    <AppContainer>
                        <Divider
                            firstChild={<Pages/>}
                            secondChild={<Terminal/>}
                        />
                    </AppContainer>
                </PaletteProvider>
            </ModuleProvider>
        </TerminalRunProvider>
    );
}