import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import { ModuleProvider } from "../../providers/module-provider";
import { Divider } from "../divider"
import { ModuleBrowser } from "../module-browser";
import { Terminal } from "../terminal"
import { Page } from "../page";
import { TerminalRunProvider } from "../../providers/terminal-run";

import "./index.scss";

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
                <Divider
                    firstChild={<Pages/>}
                    secondChild={<Terminal/>}
                />
            </ModuleProvider>
        </TerminalRunProvider>
    );
}