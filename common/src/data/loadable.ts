import { CancelablePromise } from "./cancellable-promise";

export namespace Loadable {
    export type Loading<T> = {
        kind: "loading",
        value?: undefined,
        error?: undefined,
        loading: true,
        cancel(): void,
        then<P>(cbVal: (t: Value<T>) => P, cbErr?: (e: Err<T>) => P): CancelablePromise<P>,
    };

    export type Value<T> = {
        kind: "value",
        value: T,
        error?: undefined,
        loading: false,
        reload(): Reloading<T>,
    };

    export type Err<T> = {
        kind: "error",
        value: undefined,
        error: unknown,
        loading: false,
        retry(): Loading<T>,
    };

    export type Reloading<T> = {
        kind: "reloading",
        value: T,
        error?: undefined,
        loading: true,
        cancel(): void,
        then<P>(cbVal: (t: Value<T>) => P, cbErr?: (e: Err<T>) => P): CancelablePromise<P>,
    };

    export const loading = <T>(thunk: () => CancelablePromise<T>): Loading<T> => {
        const promise = thunk();
        return ({
            kind: "loading",
            loading: true,
            cancel: () => promise.cancel(),
            then<P>(cbVal: (t: Value<T>) => P, cbErr?: (t: Err<T>) => P) {
                return promise
                    .then<P, P>(
                        (d) => cbVal(value(d, thunk)),
                        cbErr ? (e) => cbErr(error(e, thunk)) : undefined,
                    );
            }
        });
    }

    export const value = <T>(v: T, reload: () => CancelablePromise<T>): Value<T> => ({
        kind: "value",
        loading: false,
        value: v,
        reload: () => reloading(v, reload),
    });

    export const reloading = <T>(v: T, thunk: () => CancelablePromise<T>): Reloading<T> => {
        const promise = thunk();
        return {
            kind: "reloading",
            loading: true,
            value: v,
            cancel: () => promise.cancel(),
            then<P>(cbVal: (t: Value<T>) => P, cbErr?: (t: Err<T>) => P) {
                return promise
                    .then<P, P>(
                        (d) => cbVal(value(d, thunk)),
                        cbErr ? (e) => cbErr(error(e, thunk)) : undefined,
                    );
            }
        };
    }

    export const error = <T>(e: unknown, thunk: () => CancelablePromise<T>): Err<T> => {
        return {
            kind: "error",
            loading: false,
            value: undefined,
            error: e,
            retry: () => loading(thunk),
        }
    }

    export const unrecoverableError = <T>(e: unknown): Err<T> => {
        return error(e, () => { throw e });
    }
}

export type Loadable<T> =
    | Loadable.Loading<T>
    | Loadable.Value<T>
    | Loadable.Err<T>
    | Loadable.Reloading<T>
    ;

