
export type Sink<T, U> = {
    send: (value: T) => void;
    close: (value: U | undefined) => void;
}

export type Status<T, U> =
    | { kind: "alive" }
    | { kind: "dead", value?: U }
    | { kind: "piped", sink: Sink<T, U> }

/**
 * This is used to allow a function to take a parameter that is used
 * only by the type system, proving that a certain assignability relationship
 * exists.
 */
export type AssignabilityProof<T, TP> = [T] extends [TP] ? "proof" : never;


/**
 * Queues are an abstraction over asynchronous iterables
 * They operate similarly to arrays, but exist in a purely async context.
 *
 * Another way to think about them is as a combination of the abstractions of
 * node's streams and async iterables, providing the best of both.
 *
 * Note, this abstraction is not currently well suited to multiple consumers.
 */
export class Queue<T, U = undefined> {
    /**
     * Holds messages that haven't yet been consumed
     */
    private queue: T[] = [];
    /**
     * A Promise resolve that can be invoked to context switch to the requester
     */
    private resolver: (() => void) | undefined;
    /**
     * The status of the queue can be either "alive", "closed", or "piped"
     */
    private status: Status<T, U> = { kind: "alive" };

    /**
     * Returns whether the current queue is closed
     */
    public get closed() {
        return this.status.kind === "dead";
    }

    /**
     * Constructs a new queue out of an iterable or async iterable
     */
    public static async from<T, U = undefined>(iterable: Iterable<T> | AsyncIterable<T>): Promise<Queue<T, U>> {
        const queue = new Queue<T, U>();
        for await (const elt of iterable) {
            queue.push(elt);
        }
        return queue;
    }

    /**
     * A sink is a destination for the queue.
     * This function is used to implement piping, mapping, and filtering
     */
    private applySink(sink: Sink<T, U>) {
        for (const backlog of this.queue) {
            sink.send(backlog);
        }
        this.queue = [];
        this.status = { kind: "piped", sink };
    }

    /**
     * Internal helper to get a single item off the queue
     */
    private async next(): Promise<IteratorResult<T, U | undefined>> {
        if (this.status.kind === "piped") {
            throw new Error("This queue is being piped to elsewhere");
        }

        if (this.queue.length >= 1) {
            return {
                done: false,
                value: this.queue.pop()!,
            };
        }

        if (this.status.kind === "dead") {
            return {
                done: true,
                value: this.status.value,
            }
        }

        await new Promise<void>(async (resolve) => {
            this.resolver = () => { this.resolver = undefined; resolve(); };
        });

        return this.next();
    };

    /**
     * Get a single item from the queue.
     */
    public async dequeue(): Promise<T> {
        const data = await this.next();
        if (data.done) {
            throw new Error("Queue is closed");
        }
        return data.value;
    }

    /**
     * The main iteration loop. Can be used in a `for await` loop.
     */
    public [Symbol.asyncIterator]() {
        return { next: () => this.next() };
    }

    /**
     * Allows piping this queue to another queue.
     * Note that the original queue can no longer be read from after this operation
     */
    public static pipeTo<TDest, UDest, TSource extends TDest, USource extends UDest>(
        source: Queue<TSource, USource>,
        dest: Queue<TDest, UDest>,
        forwardEOF = false
    ) {
        // This is why we require a proof of assignability
        const sink: Sink<TSource, USource> = {
            send: (t) => dest.push(t),
            close: (u) => forwardEOF ? dest.close(u) : undefined,
        }
        source.applySink(sink);
    }

    /**
     * Returns a new queue that maps the values of the old queue.
     * Note that the original queue can no longer be read from after this operation
     */
    public map<TP>(f: (t: T) => TP | Promise<TP>) {
        const newQueue = new Queue<TP, U>();
        const sink: Sink<T, U> = {
            send: async (t) => newQueue.push(await f(t)),
            close: (u) => newQueue.close(u),
        }
        this.applySink(sink);
        return newQueue;
    }

    /**
     * Returns a new queue that maps the values of the old queue, binding the results into
     * the new queue.
     * Note that the original queue can no longer be read from after this operation
     */
    public bind<TP>(f: (t: T) => Iterable<TP> | Promise<Iterable<TP>>) {
        const newQueue = new Queue<TP, U>();
        const sink: Sink<T, U> = {
            send: async (t) => {
                for (const elt of await f(t)) {
                    newQueue.push(elt);
                }
            },
            close: (u) => newQueue.close(u),
        }
        this.applySink(sink);
        return newQueue;
    }

    /**
     * Returns a new queue that filters the values of the old queue.
     * Note that the original queue can no longer be read from after this operation
     */
    public filter<TP extends T>(f: (t: T) => t is TP): Queue<TP, U>;
    public filter(f: (t: T) => boolean | Promise<boolean>): Queue<T, U>;
    public filter<TP extends T = T>(f: (t: T) => boolean | Promise<boolean>) {
        const newQueue = new Queue<TP, U>();
        const sink: Sink<T, U> = {
            send: async (t) => (await f(t)) ? newQueue.push(t as TP) : undefined,
            close: (u) => newQueue.close(u),
        }
        this.applySink(sink);
        return newQueue;
    }

    /**
     * Adds a new element onto the queue, context switching into the consumer
     * if one is waiting.
     */
    public push(t: T) {
        if (this.status.kind === "dead") {
            throw new Error("Queue already closed");
        } else if (this.status.kind === "piped") {
            this.status.sink.send(t);
        } else {
            this.queue.unshift(t);
            this.resolver?.();
        }
    }

    /**
     * Closes the queue, preventing no further elements from being added.
     */
    public close(u?: U): void {
        if (this.status.kind === "dead") {
            throw new Error("Queue already closed");
        } else if (this.status.kind === "piped") {
            this.status.sink.close(u);
        } else {
            this.status = { kind: "dead", value: u };
            this.resolver?.();
        }
    }
}
