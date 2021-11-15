import * as React from "react";
import { Button, ButtonStyle, Frame, Input } from "react-pwn";
import { API } from "../../api";

import { useNav } from "../../hooks";
import { UserContext } from "../../providers/user-provider";

import "./index.scss";

export interface Props {

}

export const Settings = () => {
    const { user, reload } = React.useContext(UserContext);
    const [emailSent, setEmailSent] = React.useState(false);

    const nav = useNav();

    React.useEffect(() => {
        if (!user.loading && !user.value) {
            nav("/")();
        }
    }, [user]);

    if (!user.value) {
        return null;
    }

    return (
        <div className="settings-page app-page">
            <div className="content">
                <Frame>
                    <div className="title">User Settings</div>
                    <div className="settings-grid">
                        <div>Username</div> <Input disabled value={user.value.username} />
                        <div>Email</div> <div className="email-display">
                            <Input disabled value={user.value.email} />
                            {
                                user.value.isVerified ? null :
                                <Button
                                    label={emailSent ? "Email sent" : "Resend verification email"}
                                    onClick={async () => {
                                        setEmailSent(true);
                                        await API.User.resendVerification();
                                    }}
                                />
                            }
                        </div>
                    </div>
                </Frame>
                <Frame>
                    <div className="title">Actions</div>
                    <div className="settings-grid">
                        <div className="full">
                            <Button
                                style={ButtonStyle.Danger}
                                label="Logout"
                                onClick={async () => {
                                    await API.User.logout();
                                    reload();
                                    nav("/")();
                                }}
                            />
                        </div>
                    </div>
                </Frame>
            </div>
        </div>
    );
}