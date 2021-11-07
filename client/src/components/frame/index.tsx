import { Loadable } from "@hypatia-app/common";
import * as React from "react";

import { API } from "../../api";

export interface Props {
    module: string;
    lesson: string;
    connection: string;
}

export const Frame = (props: Props) => {
    const [connectionUri, setConnectionUri] = React.useState<Loadable<string>>(API.Service.connect(props.module, props.lesson, props.connection));

    React.useEffect(() => {
        if (connectionUri.kind === "loading") {
            connectionUri.then(setConnectionUri);
        }
    }, []);

    React.useEffect(() => {
        const loadable = API.Service.connect(props.module, props.lesson, props.connection);
        setConnectionUri(loadable);
        loadable.then(setConnectionUri);
    }, [props.module, props.lesson, props.connection]);

    if (connectionUri.value === undefined) {
        return <>Loading</>;
    }

    return (
        <iframe width="100%" height="100%" referrerPolicy="no-referrer" src={connectionUri.value}/>
    );
}