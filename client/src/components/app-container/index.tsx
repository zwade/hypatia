import * as React from "react";

import "./index.scss";

export interface Props {
    children: React.ReactNode;
}

export const AppContainer = (props: Props) => {
    return (
        <div className="app-container">
            <div className="header">Hypatia</div>
            <div className="content">
                <div className="content-inner">
                    { props.children }
                </div>
            </div>
        </div>
    );
}