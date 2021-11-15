import * as React from "react";
import { View as ViewType } from "@hypatia-app/backend/dist/client";
import { SettingsContext } from "../../providers/settings-provider";
import { Divider } from "../divider";
import { Markdown } from "../markdown";
import { Terminal } from "../terminal";
import { Frame } from "../frame";

export interface Props {
    module: string;
    lesson: string;
    view: ViewType.t;
    depth?: number;
}

export const View = (props: Props) => {
    const { module, lesson, view, depth = 0 } = props;

    const { settings } = React.useContext(SettingsContext);
    const vertical = settings.global.vertical === (depth % 2 === 0);

    if (Array.isArray(view)) {
        return (
            <Divider
                vertical={vertical}
                firstChild={
                    <View
                        module={module}
                        lesson={lesson}
                        view={view[0]}
                        depth={depth + 1}
                    />
                }
                secondChild={
                    <View
                        module={module}
                        lesson={lesson}
                        view={view[1]}
                        depth={depth + 1}
                    />
                }
            />
        )
    }

    switch (view.kind) {
        case "markdown": {
            return <Markdown module={module} lesson={lesson} file={view.fileName}/>;
        }
        case "terminal": {
            return <Terminal module={module} lesson={lesson} connection={view.connection}/>;
        }
        case "http": {
            return <Frame module={module} lesson={lesson} connection={view.connection}/>;
        }
    }
}

