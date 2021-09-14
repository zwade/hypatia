import { TokenizeContext, Code, Tokenizer, State, Effects, Token } from "micromark-util-types";
import { codes } from "micromark-util-symbol/codes";

export const isEOL = (code: Code): code is null | -5 | -4 | -3 => code === codes.carriageReturn || code === codes.lineFeed || code === codes.carriageReturnLineFeed || code === null

export type FullState = (code: Code) => FullState
export type TokenStep = (ok: FullState, nok: FullState) => FullState;

export const genUtils = (context: TokenizeContext, effects: Effects) => {
    const not = (t: TokenStep): TokenStep => (ok, nok) => t(nok, ok);

    const consume = (c: Code) => {
        if (c !== null) {
            effects.consume(c);
        }
    }

    const withNamedSteps = <T extends Token>(name: string, cb: (t: T) => void, ...args: TokenStep[]): TokenStep => (ok, nok) => {
        const fn = args.reduceRight(
            (acc: (c: Code) => FullState, val) => (prev) => val(acc, nok),
            (c: Code) => {
                const t = effects.exit(name) as T;
                cb(t);

                // Null bytes are weird because they represent the end of a block
                // We want to make sure that we close out the current logic, so
                // We forward the null byte on to as many future steps as we can
                if (c === null) {
                    return ok(c);
                } else {
                    return ok(c);
                }
            }
        );

        return (c: Code) => {
            effects.enter(name);
            return fn(null)(c);
        }
    };

    const withSteps = (...args: TokenStep[]): TokenStep => (ok, nok) => {
        const fn = args.reduceRight(
            (acc: (c: Code) => FullState, val) => (prev) => val(acc, nok),
            ok,
        );

        return (c: Code) => {
            return fn(c)(c);
        }
    };

    const expect = (c: string, cb?: (c: Code) => void): TokenStep => (ok, nok) => (code) => {
        if (c.charCodeAt(0) === code) {
            consume(code)
            cb?.(code);
            return ok(code);
        }

        return nok(code)
    }

    const readUntil = (c: string, cb?: (c: Code) => void): TokenStep => (ok, nok) => (code) => {
        consume(code);
        cb?.(code);

        if (isEOL(code)) {
            return nok(code);
        }

        if (c.charCodeAt(0) === code) {
            return ok(code);
        }

        return readUntil(c, cb)(ok, nok);
    }

    const readLine = (cb?: (c: Code) => void): TokenStep => (ok, nok) => (code) => {
        consume(code);

        if (isEOL(code)) {
            return ok(code);
        }

        cb?.(code);
        return readLine(cb)(ok, nok);
    }

    const eol: TokenStep = (ok, nok) => (code) => {
        if (isEOL(code)) {
            consume(code);
            return ok(code);
        }

        return nok(code);
    }

    const branch = (conditional: (c: Code) => boolean, first: TokenStep, second: TokenStep): TokenStep => (ok, nok) => (code) => {
        if (conditional(code)) {
            return first(ok, nok)(code);
        } else {
            return second(ok, nok)(code);
        }
    }

    const untilEOF = (step: TokenStep): TokenStep => (ok, nok) => (code) => {
        if (code !== null) {
            return step(
                (prev) => {
                    if (prev === null) {
                        return ok(prev);
                    } else {
                        return untilEOF(step)(ok, nok)
                    }
                },
                nok
            )(code);
        }

        return ok(code);
    }

    const apply = (fn: TokenStep, ok: State, nok: State) => {
        const compliantOk = (code: Code) => {
            if (code === null) {
                effects.consume(code);
            }
            return ok(code)
        }
        return fn(compliantOk as FullState, nok as FullState);
    }

    return {
        withNamedSteps,
        withSteps,
        not,
        expect,
        readUntil,
        readLine,
        eol,
        branch,
        untilEOF,
        apply,
    }
}