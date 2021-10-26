import { Module } from "@hypatia-app/backend";
import * as React from "react";
import { Modal, Checkbox } from "react-pwn";
import { API } from "../../api";


export interface Props {
    module: Module.WithSettings;

    onClose: () => void;
    refresh: () => void;
}

export const EditPane = (props: Props) => {
    const [isPublic, setPublic] = React.useState(props.module.public);
    const [disabled, setDisabled] = React.useState(props.module.disabled);

    const update = () => {
        API.Modules.updateModule(props.module.bundle.path, { public: isPublic, disabled })
            .then(() => props.refresh())
        props.onClose();
    }

    return (
        <Modal
            title={`Editing: ${props.module.bundle.name}`}
            continueMessage="Save"
            dangerous={isPublic !== props.module.public || disabled !== props.module.disabled}
            onClose={props.onClose}
            onCancel={props.onClose}
            onContinue={update}
        >
            <Checkbox
                options={[{ label: "Anyone can view", value: true }]}
                value={new Set([isPublic])}
                onChange={(s) => setPublic(s.has(true))}
            />
            <Checkbox
                options={[{ label: "Disable", value: true }]}
                value={new Set([disabled])}
                onChange={(s) => setDisabled(s.has(true))}
            />
        </Modal>
    )
}