import * as React from "react";
import { useHistory } from "react-router-dom";

const prefix = "__ls_hook";

export const useLocalStorage = <T extends any>(name: string, def: T) => {
    const itemName = `${prefix}.${name}`;
    const fromLocalStorage = localStorage.getItem(itemName);

    const stateDefault = fromLocalStorage !== null ? JSON.parse(fromLocalStorage) : def;

    const [value, setValue] = React.useState(stateDefault);

    const setFn = (t: T) => {
        localStorage.setItem(itemName, JSON.stringify(t));
        setValue(t);
    }

    return [value, setFn] as [T, (t: T) => void];

}

export const useNav = () => {
    const history = useHistory();
    return (page: string) => () => {
        history.push(page);
    };
}