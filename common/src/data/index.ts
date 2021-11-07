export class CancelablePromise<T> {
    private canceled = false;
    private cancelCallbacks = new Set<() => void>();
    private promise: Promise<T>;

    public static resolve(): CancelablePromise<void>;
    public static resolve<T>(data: T | PromiseLike<T>): CancelablePromise<T>;
    public static resolve<T>(data: T | PromiseLike<T> | undefined = undefined): CancelablePromise<T> {
        return new CancelablePromise((resolve) => resolve(data as T))
    }

    public constructor(
        cb: (
            resolve: (data: T | PromiseLike<T>) => void,
            reject: (reason: any) => void,
            addOnCancel: (handler: () => void) => () => void
        ) => void
    ) {
        this.promise = new Promise((resolve, reject) => {
            return cb(resolve, reject, (handler) => {
                this.cancelCallbacks.add(handler);
                return () => {
                    this.cancelCallbacks.delete(handler);
                };
            })
        });
    }

    public cancel() {
        if (!this.canceled) {
            this.cancelCallbacks.forEach((cb) => cb());
            this.canceled = true;
        }
    }

    public then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
        oncancel?: () => void,
    ): CancelablePromise<TResult1 | TResult2> {
        return fromPromise(this.promise.then<TResult1, TResult2>(onfulfilled, onrejected), oncancel);
    }
}

export const fromPromise = <T>(promise: Promise<T>, onCancel?: () => void): CancelablePromise<T> => {
    return new CancelablePromise<T>((resolve, reject, addOnCancel) => {
        addOnCancel(() => onCancel?.());
        promise.then(resolve).catch(reject);
    });
}

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
}

export type Loadable<T> =
    | Loadable.Loading<T>
    | Loadable.Value<T>
    | Loadable.Err<T>
    | Loadable.Reloading<T>
    ;

