import * as React from "react";
import { Map as IMap } from "immutable";

export const useHeight = () => {
    const heightRef = React.useRef(0);
    const heightMapRef = React.useRef<IMap<number, number>>(IMap());
    const [_, update] = React.useState({});

    const setHeight = (id: number) => (height: number) => {
        const oldHeight = heightMapRef.current.get(id) ?? 0;
        if (oldHeight === height) {
            return; // Don't want to force a state update
        }

        const newHeight = heightRef.current + height - oldHeight;
        heightMapRef.current = heightMapRef.current.set(id, height);
        heightRef.current = newHeight;

        update({});
    }

    return { height: heightRef.current, setHeight };
}