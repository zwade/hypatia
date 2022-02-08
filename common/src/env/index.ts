export class Env {
    public static get isProd() {
        return Env.string("MODE", { allowUndefined: true }) === "production";
    }

    public static get isDev() {
        return Env.string("MODE", { "default": "development" }) === "development";
    }
}

export namespace Env {
    export function string(name: string, options: { default: string, allowUndefined?: boolean }): string;
    export function string(name: string, options: { default?: undefined, allowUndefined: true }): string | undefined;
    export function string(name: string, options?: { default?: undefined, allowUndefined?: false }): string;
    export function string(name: string, options: { default?: string, allowUndefined?: boolean } = {}): string | undefined {
        // Notice the use of `||` instead of `??`. This is because we want it to coalesce to the default
        // If the value is undefined _or empty string_.
        const value = process.env[name] || options.default;

        if (value === undefined && !options.allowUndefined) {
            throw new Error(`Unable to get environment variable [${name}]`);
        }

        return value;
    }

    export function int(name: string, options: { default: number, allowUndefined?: boolean }): number;
    export function int(name: string, options: { default?: undefined, allowUndefined: true }): number | undefined;
    export function int(name: string, options?: { default?: undefined, allowUndefined?: false }): number;
    export function int(name: string, options: { default?: number, allowUndefined?: boolean } = {}): number | undefined {
        let result: number | undefined;
        try {
            result = parseInt(process.env[name]!, 10);
            if (Number.isNaN(result)) {
                result === undefined;
            }
        } catch (e) {
            // pass
        }

        result ??= options.default;

        if (result === undefined && !options.allowUndefined) {
            throw new Error(`Unable to get environment variable [${name}]`);
        }

        return result;
    }
}
