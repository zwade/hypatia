import * as React from "react";

import { SettingsContext } from "../../providers/settings-provider";

import "./index.scss";
import { Settings } from "./settings";

export interface Props {
    children: React.ReactNode;
}

export const AppContainer = (props: Props) => {
    const { settings, setSettings } = React.useContext(SettingsContext);
    const [showSettings, setShowSettings] = React.useState(false);

    return (
        <div className="app-container">
            <div className="header">
                <div className="logo">Hypatia</div>
                <div className="settings">
                    {
                        settings.global.vertical
                            ? <i className="button" onClick={() => setSettings({ global: { vertical: false } })}>vertical_split</i>
                            : <i className="button" onClick={() => setSettings({ global: { vertical: true } })}>horizontal_split</i>
                    }
                    <i className="button" onClick={() => setShowSettings(!showSettings)}>settings</i>
                    {
                        showSettings
                            ? <Settings onClose={() => setShowSettings(false)}/>
                            : null
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