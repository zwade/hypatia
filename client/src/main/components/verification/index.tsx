import * as React from "react";

import { UserContext } from "../../providers/user-provider";
import "./index.scss";

export const withVerification = (Component: React.ComponentType<{}>) => () => {
    const { user } = React.useContext(UserContext);

    if (!user.value || user.value.isVerified) {
        return <Component/>
    }

    return (
        <div className="please-verify">
            <p>Please verify your email address to continue.</p>
        </div>
    )
}