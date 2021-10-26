import * as React from "react";
import { Frame, Input, Button } from "react-pwn";
import { API } from "../../api";
import { useNav } from "../../hooks";
import { A } from "../a";

import "./index.scss";

export interface Props {

}

export const RequestResetPassword = (props: Props) => {
    const [email, setEmail] = React.useState("");
    const [done, setDone] = React.useState(false);
    const nav = useNav();

    const reset = async () => {
        try {
            await API.User.requestResetPassword(email);
            setDone(true);
        } catch (e) {
            // pass
        }
    }

    return (
        <div className="auth">
            <Frame className="login">
                <div className="title">Request a Password Reset</div>
                {
                    !done ? (
                        <>
                            Forgot your password? Enter your email address below and we'll help you reset it.
                            <Input
                                placeholder="Email"
                                value={email}
                                onChange={setEmail}
                                onEnter={reset}
                            />
                            <Button
                                label="Request a Reset"
                                onClick={reset}
                            />
                        </>
                    ) : (
                        <div className="data">
                            Great! We've sent an email to <b>{email}</b>
                        </div>
                    )
                }
                <div className="login">
                    You can also try logging in <A href="/user/login">here</A>.
                </div>
            </Frame>
        </div>
    )
}