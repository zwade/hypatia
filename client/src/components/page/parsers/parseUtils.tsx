import { TokenizeContext, Code, Tokenizer, State, Effects, Token, Event } from "micromark-util-types";
import { codes } from "micromark-util-symbol/codes";

export const isEOL = (code: Code): code is null | -5 | -4 | -3 => code === codes.carriageReturn || code === codes.lineFeed || code === codes.carriageReturnLineFeed || code === null

export type FullState = ((c: Code) => FullState) & { runImmediately?: boolean };

export type Next = (code: Code, consumed: boolean) => FullState;
export type TokenStep = (ok: Next, nok: FullState) => FullState;

export type MatchCriteria =
    | string
    | { start: (e: Event, next?: Event) => boolean, end: (e: Event, next?: Event) => boolean }
    ;

export const mapTag = (events: Event[], matchCriteria: MatchCriteria, cb: (subEvents: Event[]) => Event[]): Event[] => {
    const criteria =
        typeof matchCriteria === "string" ? {
            start: ([type, token]: Event) => type === "enter" && token.type === matchCriteria,
            end: ([type, token]: Event) => type === "exit" && token.type === matchCriteria,
        } : matchCriteria;

    // Invariant:
    //    patches[i].start < patches[i].end &&
    //    patches[i].end < patches[i+1].start
    type Patch = { start: number, end: number, events: Event[] };
    const applyPatches = (patches: Patch[], from: number, to: number) => {
        const [lastStartIdx, newEvts] = patches
            .reduce(
                ([si, evts], patch) => {
                    evts.push(...events.slice(si, patch.start))
                    evts.push(...patch.events);
                    return [patch.end + 1, evts] as const;
                },
                [from, []] as readonly [startIndex: number, newEvents: Event[]]
            )
        newEvts.push(...events.slice(lastStartIdx, to));
        return newEvts;
    }


    // Invariant:
    //    topLevel || (
    //      events[startIndex][0] === "enter" &&
    //      events[startIndex][1].type === tag
    //    )
    const mapRecursive = (startIndex: number, topLevel?: boolean): [newIdx: number, newEvents: Event[]] => {
        const patches: { start: number, end: number, events: Event[] }[] = [];

        let index = startIndex;
        for (index; index < events.length; index++) {
            const e = events[index];

            // Prevent infinite recursion
            if (criteria.start(e, events[index + 1]) && (topLevel || index !== startIndex)) {
                const [newIdx, newEvents] = mapRecursive(index);
                patches.push({ start: index, end: newIdx, events: newEvents });
                index = newIdx;
            }

            if (criteria.end(e, events[index + 1]) && !topLevel) {
                return [index, cb(applyPatches(patches, startIndex, index + 1))];
            }
        }

        if (!topLevel) {
            throw new Error("Invalidly nested events.")
        }

        return [index, applyPatches(patches, startIndex, index)];
    }

    return mapRecursive(0, true)[1];
}

export const runImmediately = (t: TokenStep): TokenStep => {
    return (ok, nok) => {
        const f = t(ok, nok);
        return Object.assign(f, { runImmediately: true });
    }
}

export const genUtils = (context: TokenizeContext, effects: Effects) => {
    const consume = (c: Code) => {
        // Uncomment to help trace the parser
        // console.log("Consuming", c === null || c < 0 ? c : String.fromCharCode(c));
        if (c !== null) {
            effects.consume(c);
        }
    }

    const withNamedSteps = <T extends Token>(name: string, cb: (t: T) => void, ...args: TokenStep[]): TokenStep => {
        return withSteps(
            enter(name),
            ...args,
            runImmediately(exit(name, cb)),
        )
    };

    const withSteps = (...args: TokenStep[]): TokenStep => (ok, nok) => {
        const fn = args.reduceRight(
            (acc: FullState, val, i) => {
                const cb: Next = (c, consumed) => {
                    if (!consumed || i === args.length - 1 || acc.runImmediately) {
                        return acc(c);
                    } else {
                        return acc;
                    }
                }
                return val(cb, nok)
            },
            (c: Code) => {
                return ok(c, true);
            }
        );

        return fn;
    };

    const expect = (cond: string | ((c: Code) => boolean), cb?: (c: Code) => void): TokenStep => (ok, nok) => (code) => {
        const checkFn =
            typeof cond !== "string" ? cond :
            (c: Code) => {
                const toCheck = cond.charCodeAt(0);
                return (
                    toCheck === code
                    || (toCheck === 10 && isEOL(code))
                    || (toCheck === 0 && code === null)
                );
            }

        if (checkFn(code)) {
            consume(code)
            if (typeof cond === "string" && cond.length > 1) {
                if (code === null) {
                    // If it's null, then we fail, because null always signals the end of a block;
                    return nok(code);
                }

                return expect(cond.slice(1), cb)(ok, nok);
            }

            cb?.(code);
            return ok(code, true);
        }

        return nok(code)
    }

    const readUntil = (conds: (string | TokenStep)[], cb?: (c: Code) => void): TokenStep => (ok, nok) => (code) => {
        consume(code);
        cb?.(code);

        if (code === null) {
            // If we hit this state then we've already failed, since we can't look ahead any further.
            return nok(code);
        }

        return effects.check(
            conds.map((cond) => (
                {
                    tokenize: (_effects, ok, nok) => {
                        if (typeof cond === "string") {
                            return apply(expect(cond), ok, nok);
                        } else {
                            return apply(cond, ok, nok);
                        }
                    }
                }
            )),
            (c) => {
                console.log("Hit ok", c)
                return ok(c, false);
            },
            (c) => {
                return readUntil(conds, cb)(ok, nok)(c);
            }
        ) as FullState
    }

    const enter = (name: string, fields?: Record<string, unknown>): TokenStep => (ok, nok) => (code) => {
        effects.enter(name, fields);
        return ok(code, false);
    }

    const exit = <T extends Token>(name: string, cb?: (t: T) => void): TokenStep => (ok, nok) => (code) => {
        const token = effects.exit(name) as T;
        cb?.(token);
        return ok(code, false);
    }

    const readLine = (cb?: (c: Code) => void): TokenStep => (ok, nok) => (code) => {
        consume(code);

        if (isEOL(code)) {
            return ok(code, true);
        }

        cb?.(code);
        return readLine(cb)(ok, nok);
    }

    const readBlock = (cb?: (c: Code) => void): TokenStep => (ok, nok) => (code) => {
        consume(code);

        if (code === null) {
            return ok(code, true);
        }

        cb?.(code);
        return readLine(cb)(ok, nok);
    }


    const eol: TokenStep = (ok, nok) => (code) => {
        if (isEOL(code)) {
            consume(code);
            return ok(code, true);
        }

        return nok(code);
    }

    const branch = (map: Record<NonNullable<Code>, TokenStep>): TokenStep => (ok, nok) => (code) => {
        if (code === null) {
            return nok(code);
        }

        if (!(code in map)) {
            return nok(code);
        }

        return map[code](ok, nok)(code);
    }

    const apply = (fn: TokenStep, ok: State, nok: State) => {
        const compliantOk = (code: Code, consumed: boolean) => {
            if (code === null) {
                // The handling of null is pretty janky. We'll  try to consume it if we can
                // but not worry too much if we can't
                try {
                    effects.consume(code);
                } catch {}
            }
            return ok(code)
        }
        return fn(compliantOk as FullState, nok as FullState);
    }

    /**
     * Checks whether we are in one of several tags, and returns
     * the index if we are
     */
    const findParent = (names: string | Set<string>, dontGoPast = 0) => {
        if (typeof names === "string") {
            names = new Set([names]);
        }

        const e = context.events;
        const possibilities = new Set(names);

        for (let i = e.length - 1; i >= dontGoPast; i--) {
            const [kind, token] = e[i];

            if (possibilities.has(token.type)) {
                if (kind === "enter") {
                    return i;
                } else {
                    possibilities.delete(token.type);

                    if (possibilities.size === 0) {
                        return undefined;
                    }
                }
            }
        }

        return undefined;
    }

    return {
        withNamedSteps,
        withSteps,
        expect,
        readUntil,
        readLine,
        readBlock,
        eol,
        branch,
        apply,
        enter,
        exit,
        findParent,
    }
}