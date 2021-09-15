import * as React from "react";
import { Modal } from "react-pwn";

import { TerminalRunContext } from "../../../providers/terminal-run";
import { classes, flatten, genArray } from "../../../utils/utils";

export interface Props {
    attrs?: string;
    className?: string;
    inline?: boolean;
    children: React.ReactNode;
}

export const Code = (props: Props) => {
    const { run } = React.useContext(TerminalRunContext);
    const [codeRef, setCodeRef] = React.useState<HTMLElement | null>(null);
    const [hasClicked, setHasClicked] = React.useState(false);
    const [hasAutoRun, setHasAutoRun] = React.useState(false);

    const { attrs, children, inline, ...rest } = props;
    const attrSet = new Set(attrs?.split(/\s+/) ?? []);

    const code = flatten(children);
    const isExecutable = attrSet.has("execute");

    const numLines = codeRef?.innerText.trim().split("\n").length ?? 0;

    const codeElements = (
        <span
            className={classes(
                "code",
                inline ? "inline" : "",
                isExecutable ? "executable" : "",
                hasClicked ? "clicked" : "",
                attrSet.has("numbered") ? "numbered" : "",
            )}
            onClick={() => {
                if (isExecutable && inline) {
                    run(code);
                    setHasClicked(true);
                }
            }}
        >
            <code {...rest} ref={setCodeRef}>
                {
                    attrSet.has("numbered") ? (
                        <div className="line-numbers">{ genArray(numLines, (i) => <span key={i} className="line-number"/>) }</div>
                    ) : null
                }
                { children }
            </code>
            {
                isExecutable
                    ? <span className="execute-button" onClick={() => (run(code), setHasClicked(true))}>↪</span>
                    : null
            }
        </span>
    )

    if (attrSet.has("autorun")) {
        if (hasAutoRun || !code) {
            return null
        }

        if (process.env.TRUST === "1") {
            run(code);
            setHasAutoRun(true);
        }

        return (
            <Modal
                title="Script Auto Run"
                onCancel={() => setHasAutoRun(true)}
                onContinue={() => {
                    setHasAutoRun(true);
                    run(code);
                }}
            >
                This page has asked to run the following script

                <pre>
                    <code {...rest}>
                        { children }
                    </code>
                </pre>
            </Modal>
        )
    } else {
        return codeElements;
    }
}