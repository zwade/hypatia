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
