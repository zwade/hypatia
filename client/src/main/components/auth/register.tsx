import * as React from "react";
import { Frame, Input, Button } from "react-pwn";

import { API } from "../../api";
import { useNav } from "../../hooks";
import { A } from "../a";

export interface Props {

}

export const Register = (props: Props) => {
    const [email, setEmail] = React.useState("");
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [confirm, setConfirm] = React.useState("");
    const [error, setError] = React.useState<string | undefined>()
    const nav = useNav();

    const usernameIsLongEnough = username.length >= 5;
    const passwordIsLongEnough = password.length >= 8;
    const passwordsMatch = confirm === password;

    const isValid = usernameIsLongEnough && passwordIsLongEnough && passwordsMatch;

    React.useEffect(() => {
        if (error) setError(undefined);
    }, [username, password]);

    const register = async () => {
        try {
            await API.User.register(username, email, password);
            nav("/")();
        } catch (e) {
            setError("Unable to create account")
        }
    }

    return (
        <div className="auth">
            <Frame className="login">
                <div className="title">Register</div>
                Register a free account with Hypatia.
                <Input
                    placeholder="Email"
                    value={email}
                    onChange={setEmail}
                    onEnter={register}
                />
                <Input
                    placeholder="Username"
                    value={username}
                    onChange={setUsername}
                    onEnter={register}
                    error={!usernameIsLongEnough ? "Username must be at least 5 characters" : undefined}
                />
                <Input
                    placeholder="Password"
                    value={password}
                    onChange={setPassword}
                    onEnter={register}
                    error={!passwordIsLongEnough ? "Password must be at least 8 characters" : undefined}
                    type="password"
                />
                <Input
                    placeholder="Confirm Password"
                    value={confirm}
                    onChange={setConfirm}
                    onEnter={register}
                    error={!passwordsMatch ? "Passwords don't match" : error}
                    forceError={error !== undefined}
                    type="password"
                />
                <Button
                    label="Register"
                    onClick={register}
                    disabled={!isValid}
                />
                <div className="login-instead">
                    Already have an account? Click <A href="/user/login">here</A> to login.
                </div>
            </Frame>
        </div>
    )
}