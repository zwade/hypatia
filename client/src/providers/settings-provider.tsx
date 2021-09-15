import * as React from "react";
import { useLocalStorage } from "../hooks";

export interface Settings {
    vertical: boolean;
}

export interface SettingsContextData {
    settings: Settings;
    setSettings: (settings: Partial<Settings>) => void;
}

export const SettingsContext = React.createContext<SettingsContextData>({
    settings: { vertical: false },
    setSettings: () => {},
});

export interface Props {
    children: React.ReactNode;
}

export const SettingsProvider = (props: Props) => {
    const [settings, setSettingsRaw] = useLocalStorage<Settings>(
        "settings",
        {
            vertical: false,
        }
    );

    const setSettings = (s: Partial<Settings>) => setSettingsRaw({ ...settings, ...s });

    return (
        <SettingsContext.Provider value={{ settings, setSettings }}>
            { props.children }
        </SettingsContext.Provider>
    )
}