import * as React from 'react';
import { Button, Checkbox, Radio } from 'react-pwn';
import { usePage } from '../../hooks';
import { SettingsContext, Settings as SettingsType, description } from '../../providers/settings-provider';

interface SubSettingsProps {
    settingsKey: keyof SettingsType;
    name: string;
}

const SubSettings = (props: SubSettingsProps) => {
    const { settings, setSettings } = React.useContext(SettingsContext);

    const currentSettings = settings[props.settingsKey];
    const desc = description[props.settingsKey];

    if (currentSettings === undefined || desc.length === 0) {
        return null;
    }

    const options = desc.map((d) => {
        let twiddler: JSX.Element;

        switch (d?.type) {
            case 'boolean':
                twiddler = (
                    <Radio
                        value={(currentSettings as any)[d.name] as boolean | undefined}
                        options={[ { label: "Enabled", value: true }, { label: "Disabled", value: false }]}
                        onChange={(value) => {
                            setSettings({ [props.settingsKey]: { [d.name]: value} });
                        }}
                    />
                );
        }

        return (
            <div key={d.name} className="settings-item">
                <div className="settings-desc">
                    { d.description ?? d.name }
                </div>
                {
                    d.nullable ? (
                        <i
                            className="button settings-clear"
                            onClick={() => setSettings({ [props.settingsKey]: { [d.name]: undefined } })}
                        >
                            close
                        </i>
                    ) : null
                }
                <div className="settings-twiddler">
                    { twiddler }
                </div>
            </div>
        )

    });

    return (
        <div className="sub-settings">
            <div className="name">{ props.name }</div>
            { options }
        </div>
    );
}

export interface Props {
    onClose: () => void;
}

export const Settings = (props: Props) => {
    const { page } = React.useContext(SettingsContext);

    return (
        <>
            <div className="event-catcher" onClick={props.onClose}/>
            <div className="settings-holder">
                <div className="settings-panel">
                    <div className="settings-title">Settings</div>
                    <SubSettings settingsKey="global" name="Global Settings"/>
                    <SubSettings settingsKey="module" name={`Module Settings (${page?.module})`}/>
                    <SubSettings settingsKey="lesson" name={`Lesson Settings (${page?.lesson})`}/>
                    <SubSettings settingsKey="page" name={`Page Settings (page ${page?.page})`}/>
                    <Button label="Close" onClick={props.onClose}/>
                </div>
            </div>
        </>
    );
};