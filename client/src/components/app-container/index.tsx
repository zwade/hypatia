import * as React from "react";
import { useNav } from "../../hooks";

import { SettingsContext } from "../../providers/settings-provider";
import { UserContext } from "../../providers/user-provider";
import { minmax } from "../../utils/utils";

import "./index.scss";
import { Settings } from "./settings";

export interface Props {
    children: React.ReactNode;
}

const totalHeight = 64;
const approachDistance = 32;
const minHeight = 32;

export const AppContainer = (props: Props) => {
    const isShowing = React.useRef(false);
    const [shouldShow, setShouldShow] = React.useState(isShowing.current);
    const { settings, setSettings } = React.useContext(SettingsContext);
    const { user } = React.useContext(UserContext);
    const [showSettings, setShowSettings] = React.useState(false);
    const nav = useNav();

    React.useEffect(() => {
        const mouseMove = (e: MouseEvent) => {
            const inBuffer = e.clientY < minHeight;
            const overElement = isShowing.current && e.clientY < totalHeight + approachDistance;
            const newShouldShow = inBuffer || overElement

            if (newShouldShow !== isShowing.current) {
                isShowing.current = newShouldShow;
                setShouldShow(newShouldShow);
            }
        }

        document.addEventListener("mousemove", mouseMove);

        return () => {
            document.removeEventListener("mousemove", mouseMove);
        }
    }, []);

    const lockHeader = settings.global.lockHeader || settings.page === undefined

    const containerMaxHeight =
        lockHeader ? totalHeight :
        minHeight;

    const bottom =
        lockHeader ? 0 :
        shouldShow ? -(totalHeight - minHeight) : 0;

    const fontSize = (lockHeader || shouldShow) ? 32 : (totalHeight - minHeight - 8);

    const isSingle = process.env.isSingle === "true";

    return (
        <div className="app-container">
            <div className="header-container" data-locked={lockHeader} data-show={shouldShow}>
                <div className="header" style={{ bottom }}>
                    <div className="logo" onClick={nav("/")} style={{ fontSize }}>Hypatia</div>
                    <div className="settings">
                        {
                            user.value && settings.page !== undefined ? (
                                <>
                                    {
                                        settings.global.lockHeader
                                            ? <i className="button" onClick={() => setSettings({ global: { lockHeader: false }})}>lock</i>
                                            : <i className="button" onClick={() => setSettings({ global: { lockHeader: true }})}>lock_open</i>
                                    }
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
                                </>
                            ) : undefined
                        }
                        {
                            user.value && settings.page !== undefined && !isSingle ? (
                                <div className="divider"/>
                            ) : undefined
                        }
                        {
                            isSingle ? undefined :
                            user.value ? (
                                <>
                                    <i className="button" onClick={nav("/editor")}>edit</i>
                                    <i className="button" onClick={nav("/user/settings")}>account_circle</i>
                                </>
                            ) : (
                                <i className="button" onClick={nav("/user/login")}>login</i>
                            )
                        }
                    </div>
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