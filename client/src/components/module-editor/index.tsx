import * as React from "react";
import { Route, Switch } from "react-router";
import { Selector } from "./selector";

import "./index.scss";

export const ModuleEditor = () => {
    return (
        <div className="app-page module-editor">
            <div className="content">
                <Switch>
                    <Route path="/editor" exact component={Selector}/>
                </Switch>
            </div>
        </div>
    );
};