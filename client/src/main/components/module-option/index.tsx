import * as React from "react";
import type { Module } from "@hypatia-app/backend";

import "./index.scss";

export interface Props {
    module: Module.WithSettings;
    onClick: () => void;
}

export const ModuleOption = (props: Props) => {
    return (
        <div className="module-option" onClick={props.onClick}>
            <div className="option-status" data-public={ props.module.public } data-deleted={ props.module.disabled }/>
            <div className="option-title">{ props.module.bundle.name }</div>
            <div className="option-info">
                {
                    props.module.bundle.lessons.length <= 3 ?
                        props.module.bundle.lessons.map((lesson) => <div key={lesson.path} className="lesson">{ lesson.name }</div>) :
                        props.module.bundle.lessons.slice(0, 2)
                            .map((lesson) => <div key={lesson.path} className="lesson">{ lesson.name }</div>)
                            .concat([<div key="andmore" className="lesson">...and { props.module.bundle.lessons.length - 2 } others</div>])
                }
            </div>
        </div>
    );
};