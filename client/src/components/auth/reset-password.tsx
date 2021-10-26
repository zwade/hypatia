import * as React from "react";
import { Frame, Input, Button } from "react-pwn";
import { useHistory } from "react-router";
import { API } from "../../api";
import { useNav } from "../../hooks";
import { A } from "../a";

import "./index.scss";

export interface Props {

}

export const ResetPassword = (props: Props) => {
    const [password, setPassword] = React.useState("");
    const [confirm, setConfirm] = React.useState("");
    const history = useHistory();
    const nav = useNav();

    const params = new URLSearchParams(history.location.search);
    const token = params.get("token")!;
    const email = params.get("email")!;

    const passwordIsLongEnough = password.length >= 8;
    const passwordsMatch = password === confirm;

    const reset = async () => {
        if (!passwordIsLongEnough || !passwordsMatch) {
            return;
        }

        try {
            await API.User.resetPassword(email, token, password);
            nav("/")();
        } catch (e) {
            // pass
        }
    }

    return (
        <div className="auth">
            <Frame className="login">
                <div className="title">Reset Password</div>
                Enter a new password to reset your account
                <Input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    error={!passwordIsLongEnough ? "Password must be at least 8 characters" : undefined}
                    onEnter={reset}
                />
                <Input
                    placeholder="Confirm Password"
                    type="password"
                    value={confirm}
                    onChange={setConfirm}
                    error={!passwordsMatch ? "Passwords must match" : undefined}
                    onEnter={reset}
                />
                <Button
                    label="Request a Reset"
                    onClick={reset}
                />
                <div className="login">
                    You can also try logging in <A href="/user/login">here</A>.
                </div>
            </Frame>
        </div>
    )
}