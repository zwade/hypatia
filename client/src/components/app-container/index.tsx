import * as React from "react";

import { SettingsContext } from "../../providers/settings-provider";

import "./index.scss";

export interface Props {
    children: React.ReactNode;
}

export const AppContainer = (props: Props) => {
    const { settings, setSettings } = React.useContext(SettingsContext);

    return (
        <div className="app-container">
            <div className="header">
                <div className="logo">Hypatia</div>
                <div className="settings">
                    {
                        settings.vertical
                            ? <i className="button" onClick={() => setSettings({ vertical: false })}>vertical_split</i>
                            : <i className="button" onClick={() => setSettings({ vertical: true })}>horizontal_split</i>
                    }
                </div>
            </div>
            <div className="content">
                <div className="content-inner">
                    { props.children }
                </div>
            </div>
        </div>
    );
}