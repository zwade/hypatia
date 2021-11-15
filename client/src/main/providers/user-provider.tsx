import { Loadable } from "@hypatia-app/common";
import { User } from "@hypatia-app/backend/dist/client";
import * as React from "react";
import { TheGreatLie } from "react-pwn";
import { API } from "../api";

export interface UserData {
    user: Loadable<User>;
    reload: () => void;
}

export const UserContext = React.createContext<UserData>(TheGreatLie());

export interface Props {
    children: React.ReactNode;
}

export const UserProvider = (props: Props) => {
    const [user, setUser] = React.useState<Loadable<User>>(() => API.User.self());

    React.useEffect(() => {
        if (user.kind === "loading" || user.kind === "reloading") {
            user.then(setUser, setUser);
        }
    }, [user]);

    const reload = () => {
        if (user.kind === "value") { setUser(user.reload()) }
        if (user.kind === "error") { setUser(user.retry()) }
    }

    return (
        <UserContext.Provider value={{ user, reload }}>
            { props.children }
        </UserContext.Provider>
    )

}