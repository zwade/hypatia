import * as React from "react";

export const useDebounce = <Args extends unknown[]>(duration: number, fn: (...args: Args) => void) => {
    const timeout = React.useRef<NodeJS.Timeout | null>(null);
    const lastFired = React.useRef<number>(0);

    const debounceFn = React.useMemo(() => {
        return (...args: Args) => {
            const now = Date.now();
            const timeSinceLastFired = now - lastFired.current;
            if (timeSinceLastFired > duration) {
                lastFired.current = now;
                fn(...args);
                return true;
            }

            const timeRemaining = duration - timeSinceLastFired;
            if (timeout.current) {
                clearTimeout(timeout.current);
            }

            timeout.current = setTimeout(() => {
                lastFired.current = Date.now();
                fn(...args);
            }, timeRemaining);

            return false;
        }
    }, [fn]);

    return debounceFn;
}

export const loadScript = (src: string, options: { async?: boolean, defer?: boolean } = {}) => {
    return new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src

        script.async = options.async ?? false;
        script.defer = options.defer ?? false;
        script.onload = () => {
            resolve();
        }

        script.onerror = (e) => {
            reject(e);
        }

        document.querySelector("head")!.appendChild(script);
    })
}