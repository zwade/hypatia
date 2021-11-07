export class TypedEventEmitter<E extends string, T extends { [K in E]: unknown[] }> {
    private _listeners: {
        [K in keyof T]: Set<(...args: T[K]) => void>
    } = Object.create(null);

    public on<K extends keyof T>(event: K, listener: (...args: T[K]) => void) {
        this._listeners[event] ??= new Set();
        this._listeners[event].add(listener);

        return () => {
            this._listeners[event]?.delete(listener);
        }
    }

    public off<K extends keyof T>(event: K, listener: (...args: T[K]) => void) {
        this._listeners[event]?.delete(listener);
    }

    public emit<K extends keyof T>(event: K, ...args: T[K]) {
        this._listeners[event]?.forEach((listener) => listener(...args));
    }
}