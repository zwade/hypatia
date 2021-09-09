import * as React from "react";

import { TerminalRunContext } from "../../providers/terminal-run";
import { classes, flatten } from "../../utils/utils";

export interface Props {
    attrs?: string;
    className?: string;
    inline?: boolean;
    children: React.ReactNode;
}

export const Code = (props: Props) => {
    const { run } = React.useContext(TerminalRunContext);
    const [hasClicked, setHasClicked] = React.useState(false);

    const { attrs, children, inline, ...rest } = props;
    const attrSet = new Set(attrs?.split(/\s+/) ?? []);

    const code = flatten(children).trim() + "\n";
    const isExecutable = attrSet.has("execute");

    return (
        <span
            className={classes("code", inline ? "inline" : "", isExecutable ? "executable" : "", hasClicked ? "clicked" : "")}
            onClick={() => {
                if (isExecutable && inline) {
                    run(code);
                    setHasClicked(true);
                }
            }}
        >
            <code {...rest}>{ children }</code>
            {
                isExecutable
                    ? <span className="execute-button" onClick={() => (run(code), setHasClicked(true))}>↪</span>
                    : null
            }
        </span>
    );
}