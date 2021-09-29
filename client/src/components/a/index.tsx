import * as React from "react";
import { classes } from "react-pwn";
import { useNav } from "../../hooks";

import "./index.scss";

export interface Props {
    className?: string;
    href?: string;
    onClick?: () => void;
    children?: React.ReactNode;
}

export const A = (props: Props) => {
    const nav = useNav();
    return (
        <div
            className={classes("anchor", props.className)}
            onClick={() => {
                props.onClick?.();
                props.href ? nav(props.href)() : undefined;
            }}
        >
            { props.children }
        </div>
    );
}