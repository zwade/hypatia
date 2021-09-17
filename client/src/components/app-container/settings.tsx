import * as React from 'react';
import { Checkbox, Radio } from 'react-pwn';
import { usePage } from '../../hooks';
import { SettingsContext, Settings as SettingsType, description } from '../../providers/settings-provider';

interface SubSettingsProps {
    key: keyof SettingsType;
    name: string;
}

const SubSettings = (props: SubSettingsProps) => {
    const { settings, setSettings } = React.useContext(SettingsContext);

    const currentSettings = settings[props.key];
    const desc = description[props.key];

    if (currentSettings === undefined) {
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
                            setSettings({ [props.key]: { [d.name]: value} });
                        }}
                    />
                );
        }

        return (
            <div key={d.name} className="settings-item">
                <div className="settings-desc">
                    { d.description ?? d.name }
                    {
                        d.nullable ? (
                            <div
                                className="settings-clear"
                                onClick={() => setSettings({ [props.key]: { [d.name]: undefined } })}
                            />
                        ) : null
                    }
                </div>

                { twiddler }
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

}

export const Settings = (props: Props) => {
    const page = usePage();

    return (
        <div className="settings-holder">
            <div className="settings-panel">
                <div className="settings-title">Settings</div>
                <SubSettings key="global" name="Global Settings"/>
                <SubSettings key="module" name={`Module (${page?.module})`}/>
                <SubSettings key="lesson" name={`Lesson (${page?.lesson})`}/>
                <SubSettings key="page" name={`Page (${page?.page})`}/>
            </div>
        </div>
    );
};