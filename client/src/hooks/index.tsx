import * as React from "react";
import { useHistory, useParams } from "react-router-dom";

const prefix = "__ls_hook";

const queryLocalStorage = <T extends any>(name: string) => {
    const fromLocalStorage = localStorage.getItem(name);
    try {
        return fromLocalStorage !== null ? JSON.parse(fromLocalStorage) as T : undefined;
    } catch (e) {
        return undefined;
    }
}

export const useLocalStorage = <T extends any>(name: string, def: T) => {
    const itemName = `${prefix}.${name}`;

    const lsDefault: T | undefined = queryLocalStorage<T>(itemName);

    const [valueRaw, setValue] = React.useState<T | undefined>(undefined);
    const value =
        valueRaw !== undefined ? valueRaw :
        lsDefault !== undefined ? lsDefault :
        def;


    React.useEffect(() => {
        setValue(undefined);
    }, [name])

    const updateLocalStorage = useRateLimit((t: T) => {
        localStorage.setItem(itemName, JSON.stringify(t))
    }, 500, [name]);

    const setFn = (t: T) => {
        updateLocalStorage(t);
        setValue(t);
    }

    const mergeFn = (t: T extends {} ? Partial<T> : never) => {
        if (typeof t !== "object") {
            console.warn("Cannot call [useLocalStorage.merge] on non-object");
            return setFn(t as T);
        }

        let updatedState = queryLocalStorage<T>(itemName);
        if (updatedState === undefined) {
            console.warn("State merge couldn't find [localStorage] key");
            updatedState = value;
        }

        const mergedState = { ...updatedState as object, ...t } as T;
        setFn(mergedState);
    }

    return [value, setFn, mergeFn] as const;

}

export const useNav = () => {
    const history = useHistory();
    return (page: string) => () => {
        history.push(page);
    };
}

export const usePage = () => {
    const params = useParams<{ lesson?: string; module?: string; page?: string }>();

    if (!params.lesson || !params.module || !params.page) {
        return undefined;
    }

    return {
        lesson: params.lesson,
        module: params.module,
        page: params.page,
        path: `${params.module}/${params.lesson}/${params.page}`
    }
}

export const useRateLimit = <A extends unknown[]>(cb: (...args: A) => void, timeout = 100, flushEvents?: unknown[]): (...args: A) => void => {
    const thunkRef = React.useRef<(() => void) | undefined>();
    const timeoutRef = React.useRef<NodeJS.Timeout | undefined>();

    React.useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
        }
        if (thunkRef.current) {
            thunkRef.current();
            thunkRef.current = undefined;
        }
    }, flushEvents);

    return (...args) => {
        if (timeoutRef.current !== undefined) {
            thunkRef.current = () => cb(...args);
        } else {
            timeoutRef.current = setTimeout(() => {
                timeoutRef.current = undefined;
                const toCall = thunkRef.current;
                thunkRef.current = undefined;
                toCall?.();
            }, timeout)
            cb(...args);
        }
    }
}