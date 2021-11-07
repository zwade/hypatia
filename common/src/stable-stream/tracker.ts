type ClosableStream = {
    on(e: "close", cb: () => void): void;
    off(e: "close", cb: () => void): void;
}

type TrackedStream = {
    cascades: boolean;
    callback: () => void; // For cleanup
    closer: () => void;
}

export class Tracker {
    private onStale;
    private staleTimeoutEvent: NodeJS.Timeout | null = null;
    private timeout;
    private trackedStreams: Map<ClosableStream, TrackedStream> = new Map();

    constructor(onStale: () => void, timeout = 30_000) {
        this.onStale = onStale;
        this.timeout = timeout;
    }

    public track(stream: ClosableStream & { close(): void }, cascades: boolean): void
    public track(stream: ClosableStream, closer: () => void, cascades: boolean): void;
    public track(stream: ClosableStream, ...args: [(() => void), boolean] | [boolean]): void {
        const closer =
            typeof args[0] === "function" ? args[0] :
            (stream as ClosableStream & { close(): void }).close.bind(stream);

        const cascades =
            typeof args[0] === "boolean" ? args[0] :
            typeof args[1] === "boolean" ? args[1] :
            false;

        const callback = this.closeHandler(stream);

        stream.on("close", callback);
        this.trackedStreams.set(stream, {
            cascades,
            callback,
            closer,
        });

        console.log(`Tracking new stream: ${this.trackedStreams.size}`);
    }

    public untrack(stream: ClosableStream) {
        const trackedStream = this.trackedStreams.get(stream);
        if (!trackedStream) {
            return false;
        }

        stream.off("close", trackedStream.callback);
        this.trackedStreams.delete(stream);

        if (trackedStream.cascades) {
            this.closeAll();
        } else if (this.trackedStreams.size === 0) {
            this.prepareDestruction();
        }

        console.log(`Untracking stream: ${this.trackedStreams.size}`);
    }

    public closeAll() {
        for (const [stream, options] of [...this.trackedStreams]) {
            stream.off("close", options.callback);
            this.trackedStreams.delete(stream);

            try {
                options.closer();
            } catch (e) {
                console.warn(e);
            }
        }

        this.prepareDestruction();
    }

    private cancelDestruction() {
        if (this.staleTimeoutEvent) {
            clearTimeout(this.staleTimeoutEvent);
            this.staleTimeoutEvent = null;
        }
    }

    private prepareDestruction() {
        this.cancelDestruction();
        this.staleTimeoutEvent = setTimeout(this.onStale, this.timeout);
    }

    private closeHandler(stream: ClosableStream) {
        return () => {
            this.untrack(stream);
        }
    }
}

