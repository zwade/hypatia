import * as React from "react";
import { Frame, Input, Button } from "react-pwn";
import { API } from "../../api";
import { useNav } from "../../hooks";
import { UserContext } from "../../providers/user-provider";
import { A } from "../a";

import "./index.scss";

export interface Props {

}

export const Login = (props: Props) => {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState<string | undefined>()
    const { reload } = React.useContext(UserContext);
    const nav = useNav();

    React.useEffect(() => {
        if (error) setError(undefined);
    }, [username, password]);

    const login = async () => {
        try {
            await API.User.login(username, password);
            reload();
            nav("/")();
        } catch (e) {
            setError("Invalid credentials")
        }
    }

    return (
        <div className="auth">
            <Frame className="login">
                <div className="title">Login</div>
                Enter your username and password to log in to Hypatia.
                <Input
                    placeholder="Username"
                    value={username}
                    onChange={setUsername}
                    onEnter={login}
                />
                <Input
                    placeholder="Password"
                    value={password}
                    onChange={setPassword}
                    onEnter={login}
                    error={error}
                    forceError={error !== undefined}
                    type="password"
                />
                <div>
                    Forgot your password? Reset it <A href="/user/request-reset-password">here</A>.
                </div>
                <Button
                    label="Login"
                    onClick={login}
                />
                <div className="register">
                    Don't have an account? Click <A href="/user/register">here</A> to create one.
                </div>
            </Frame>
        </div>
    )
}