import * as React from "react";
import { Module } from "@hypatia-app/backend";
import { Button, EmptyModal } from "react-pwn";
import { API } from "../../api";

export interface Props {
    module: Module.WithSettings;
    reload: () => void;
    onClose: () => void;
}

export const PublicModal = (props: Props) => {
    const bundle = props.module.bundle;

    return (
        <EmptyModal
            onClose={props.onClose}
        >
            <div className="option-popup public-popup">
                <h1>{bundle.name}</h1>
                <Button
                    label="Subscribe"
                    onClick={async () => {
                        await API.Modules.subscribe(bundle.path)
                        props.reload();
                        props.onClose();
                    }}
                />
            </div>
        </EmptyModal>
    )
}