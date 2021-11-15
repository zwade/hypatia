import * as React from "react";
import { Checkbox, Modal } from "react-pwn";
import { useLocalStorage, usePage } from "../../../hooks";
import { SettingsContext } from "../../../providers/settings-provider";

import { TerminalRunContext } from "../../../providers/terminal-run";
import { classes, flatten, genArray } from "../../../utils/utils";


interface AutoRunModalProps {
    run: () => void;
    cancel: () => void;
    children: React.ReactNode;
}

const AutoRunModal = (props: AutoRunModalProps) => {
    const [rememberFlags, setRememberFlags] = React.useState(new Set<"page" | "module">());

    const { settings, setSettings } = React.useContext(SettingsContext);

    const remember = settings.page?.autoRun ?? settings.module?.autoRun;

    if (process.env.TRUST === "1") {
        props.run();
        return null;
    }

    if (remember === true) {
        props.run();
        return null;
    }

    if (remember === false) {
        props.cancel();
        return null;
    }

    const submit = (run: boolean) => () => {
        if (rememberFlags.has("page")) {
            setSettings({ page: { autoRun: run } });
        }

        if (rememberFlags.has("module")) {
            setSettings({ module: { autoRun: run } });
        }

        if (run) {
            props.run();
        } else {
            props.cancel();
        }
    }

    return (
        <Modal
            title="Script Auto Run"
            onCancel={submit(false)}
            onContinue={submit(true)}
            onClose={props.cancel}
        >
            This page has asked to run the following script

            <pre>
                { props.children }
            </pre>

            <div className="remember-actions">
                <Checkbox
                    options={[
                        { "label": "Remember my choice for this page", value: "page" as const },
                        { "label": "Remember my choice for this module", value: "module" as const },
                    ]}
                    value={rememberFlags}
                    onChange={setRememberFlags}
                />
            </div>
        </Modal>
    );
}

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
        >
            <code
                {...rest}
                ref={setCodeRef}
                onClick={() => {
                    if (isExecutable && inline) {
                        run(code + "\n");
                        setHasClicked(true);
                    }
                }}
            >
                {
                    attrSet.has("numbered") ? (
                        <div className="line-numbers">{ genArray(numLines, (i) => <span key={i} className="line-number"/>) }</div>
                    ) : null
                }
                { children }
            </code>
            {
                isExecutable
                    ? (
                        <span
                            className="execute-button"
                            onClick={() => {
                                if (!inline) {
                                    run(code);
                                } else {
                                    run(code + "\n")
                                }
                                setHasClicked(true)
                            }}
                        >
                            ↪
                        </span>
                    ) : null
            }
        </span>
    )

    if (attrSet.has("autorun")) {
        if (hasAutoRun || !code) {
            return null
        }

        return (
            <AutoRunModal
                cancel={() => setHasAutoRun(true)}
                run={() => {
                    setHasAutoRun(true);
                    run(code);
                }}
            >
                <code {...rest}>
                    { children }
                </code>
            </AutoRunModal>
        )
    } else {
        return codeElements;
    }
}