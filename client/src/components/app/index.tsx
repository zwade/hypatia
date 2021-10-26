import * as React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { PaletteProvider, ModalProvider } from "react-pwn";

import { ModuleProvider } from "../../providers/module-provider";
import { ModuleBrowser } from "../module-browser";
import { TerminalRunProvider } from "../../providers/terminal-run";
import { BlueGreen } from "../../utils/palette";
import { AppContainer } from "../app-container";
import { SettingsContext, SettingsProvider } from "../../providers/settings-provider";
import { UserContext, UserProvider } from "../../providers/user-provider";
import { Login, Register, RequestResetPassword, ResetPassword } from "../auth";
import { useNav } from "../../hooks";
import { Page } from "../page";

import "./index.scss";
import { Settings } from "../settings";
import { ModuleEditor } from "../module-editor";

const TopLevelPages = (props: { children: React.ReactNode }) => (
    <Switch>
        <Route exact path="/user/login" component={Login} />
        <Route exact path="/user/register" component={Register} />
        <Route exact path="/user/request-reset-password" component={RequestResetPassword} />
        <Route exact path="/user/reset-password" component={ResetPassword} />
        { props.children }
    </Switch>
);

const Pages = () => (
    <>
        <Route exact path="/" component={ModuleBrowser} />
        <Route exact path="/user/settings" component={Settings} />
        <Route path="/editor" component={ModuleEditor} />
        <Route exact path="/:module/:lesson/:page" component={Page} />
    </>
);

const Content = () => {
    const { settings } = React.useContext(SettingsContext)
    const { user } = React.useContext(UserContext);
    const nav = useNav();

    switch (user.kind) {
        case "error": {
            nav("/user/login")();
            return null;
        }
        case "loading": {
            return <h1>Loading</h1>;
        }
        case "reloading":
        case "value": {
            return (
                <Pages/>
            );
        }
    }
}

export const App = () => {
    return (
        <Router>
            <TerminalRunProvider>
                <ModuleProvider>
                    <PaletteProvider palette={BlueGreen}>
                        <SettingsProvider>
                            <ModalProvider>
                                <UserProvider>
                                    <AppContainer>
                                        <TopLevelPages>
                                            <Content/>
                                        </TopLevelPages>
                                    </AppContainer>
                                </UserProvider>
                            </ModalProvider>
                        </SettingsProvider>
                    </PaletteProvider>
                </ModuleProvider>
            </TerminalRunProvider>
        </Router>
    );
}