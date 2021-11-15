import * as React from "react";
import { Module } from "@hypatia-app/backend";
import { Button, EmptyModal } from "react-pwn";
import { useNav } from "../../hooks";
import { LessonSelect } from "./lesson-select";

export interface Props {
    module: Module.WithSettings;
    onClose: () => void;
}

export const SubscriptionModal = (props: Props) => {
    const nav = useNav();
    const bundle = props.module.bundle;

    return (
        <EmptyModal
            onClose={props.onClose}
        >
            <div className="option-popup subscription-popup">
                <h1>{bundle.name}</h1>
                <Button
                    label="Start Now"
                    onClick={nav(`/${bundle.path}/${bundle.lessons[0].path}/${bundle.lessons[0].pages[0].path}`)}
                />
                <div className="subscription-lessons">
                    <LessonSelect module={props.module} />
                </div>
            </div>
        </EmptyModal>
    )
}