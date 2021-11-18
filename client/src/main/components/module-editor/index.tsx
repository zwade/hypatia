import * as React from "react";
import { Route, Switch } from "react-router";
import { Selector } from "./selector";

import "./index.scss";
import { ModuleExplorer } from "./module-explorer";

export const ModuleEditor = () => {
    return (
        <div className="app-page module-editor">
            <div className="content">
                <Switch>
                    <Route path="/editor" exact component={Selector}/>
                    <Route path="/editor/:module" component={ModuleExplorer}/>
                </Switch>
            </div>
        </div>
    );
};