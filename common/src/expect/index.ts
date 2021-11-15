import { M, Marshaller } from "@zensors/sheriff";
import { JsonSerializable } from "./json-serializable";

export namespace Expect {
    type ExpectBase =
        | ["anything"]
        | ["stringMatching", string]
        | ["toBe", JsonSerializable.t]
        | ["toBeTruthy"]
        | ["toBeNullish"]
        | ["toBeUndefined"]
        | ["toBeGreaterThan", number]
        | ["toBeGreaterThanOrEqual", number]
        | ["toContain", JsonSerializable.t]
        | ["toBeAcceptedBy", string, string]
        | ["toThrow"]

    export type t =
        | ExpectBase
        | ["not", ...ExpectBase]

    export const MExpect: Marshaller<t> = M.union(
        M.union(
            M.tup(M.lit("anything")),
            M.tup(M.lit("stringMatching"), M.str),
            M.tup(M.lit("toBe"), JsonSerializable.MJsonSerializable),
            M.tup(M.lit("toBeTruthy")),
            M.tup(M.lit("toBeNullish")),
            M.tup(M.lit("toBeUndefined")),
            M.tup(M.lit("toBeGreaterThan"), M.num),
            M.tup(M.lit("toBeGreaterThanOrEqual"), M.num),
            M.tup(M.lit("toContain"), JsonSerializable.MJsonSerializable),
            M.tup(M.lit("toThrow")),
        ),
        M.tup(M.lit("toBeAcceptedBy"), M.str, M.str),
        M.union(
            M.tup(M.lit("not"), M.lit("anything")),
            M.tup(M.lit("not"), M.lit("stringMatching"), M.str),
            M.tup(M.lit("not"), M.lit("toBe"), JsonSerializable.MJsonSerializable),
            M.tup(M.lit("not"), M.lit("toBeTruthy")),
            M.tup(M.lit("not"), M.lit("toBeNullish")),
            M.tup(M.lit("not"), M.lit("toBeUndefined")),
            M.tup(M.lit("not"), M.lit("toBeGreaterThan"), M.num),
            M.tup(M.lit("not"), M.lit("toBeGreaterThanOrEqual"), M.num),
            M.tup(M.lit("not"), M.lit("toContain"), JsonSerializable.MJsonSerializable),
            M.tup(M.lit("not"), M.lit("toThrow"))
        ),
        M.tup(M.lit("not"), M.lit("toBeAcceptedBy"), M.str, M.str),
    )

    export type TestResult =
        | ["success"]
        | ["failure", string]
        | ["domain-error", string]
        | ["test-disabled", string]
        ;

    const judgeResult = (
        expect: Expect.t,
        result: unknown,
        error: string | undefined,
        allowUnsafeEval: boolean,
    ): TestResult => {
        const isNegated = expect[0] === "not";
        const base = isNegated ? expect.slice(1) as ExpectBase : expect;

        if (base[0] !== "toThrow") {
            if (error !== undefined) {
                return ["failure", `Expected function to run, but received error:\n${error}`]
            }
        }

        switch (base[0]) {
            case "anything": {
                const success = result !== undefined && result !== null;
                return (
                    success === !isNegated ? ["success"] :
                    success ? ["failure", `expected nothing, go ${result}`] :
                    ["failure", `expected anything, got ${result}`]
                );
            }
            case "stringMatching": {
                if (typeof result !== "string") {
                    return ["domain-error", `expected string matching /${base[1]}/, got ${result}`];
                }

                const regex = new RegExp(base[1]);
                const match = result.match(regex);
                return (
                    match !== null === !isNegated ? ["success"] :
                    match !== null ? ["failure", `expected string to not match /${base[1]}/, got ${result}`] :
                    ["failure", `expected string matching /${base[1]}/, got ${result}`]
                );
            }
            case "toBe": {
                const success = JsonSerializable.equal(result as JsonSerializable.t, base[1]);
                return (
                    success === !isNegated ? ["success"] :
                    success ? ["failure", `expected ${JSON.stringify(result)} to not be ${JSON.stringify(base[1])}` ] :
                    ["failure", `expected ${JSON.stringify(result)} to be ${JSON.stringify(base[1])}`]
                )
            }
            case "toBeGreaterThan": {
                if (typeof result !== "number") {
                    return ["domain-error", `expected number, got ${typeof result}`];
                }

                const success = result > base[1];
                return (
                    success === !isNegated ? ["success"] :
                    success ? ["failure", `expected ${result} to be less than or equal to ${base[1]}`] :
                    ["failure", `expected ${result} to be greater than ${base[1]}`]
                );
            }
            case "toBeGreaterThanOrEqual": {
                if (typeof result !== "number") {
                    return ["domain-error", `expected number, got ${typeof result}`];
                }

                const success = result >= base[1];
                return (
                    success === !isNegated ? ["success"] :
                    success ? ["failure", `expected ${result} to be less than ${base[1]}`] :
                    ["failure", `expected ${result} to be greater than or equal to ${base[1]}`]
                );
            }
            case "toBeNullish": {
                const success = result === null || result === undefined;
                return (
                    success === !isNegated ? ["success"] :
                    success ? ["failure", `expected ${result} to not be nullish`] :
                    ["failure", `expected ${result} to be nullish`]
                )
            }
            case "toBeTruthy": {
                const success = !!result;
                return (
                    success === !isNegated ? ["success"] :
                    success ? ["failure", `expected ${result} to not be truthy`] :
                    ["failure", `expected ${result} to be truthy`]
                );
            }
            case "toBeUndefined": {
                const success = result === undefined;
                return (
                    success === !isNegated ? ["success"] :
                    success ? ["failure", `expected ${result} to not be undefined`] :
                    ["failure", `expected ${result} to be undefined`]
                );
            }
            case "toContain": {
                if (!Array.isArray(result)) {
                    return ["domain-error", `Expected array, got ${typeof result}`];
                }

                const success = result.some((item) => JsonSerializable.equal(item, base[1]));
                return (
                    success === !isNegated ? ["success"] :
                    success ? ["failure", `expected ${result} to not contain ${JSON.stringify(base[1])}`] :
                    ["failure", `expected ${result} to contain ${JSON.stringify(base[1])}`]
                );
            }
            case "toThrow": {
                const success = error !== undefined;
                return (
                    success === !isNegated ? ["success"] :
                    success ? ["failure", `expected ${result} to not throw an error`] :
                    ["failure", `expected ${result} to throw an error`]
                )
            }
            case "toBeAcceptedBy": {
                if (!allowUnsafeEval) {
                    return ["test-disabled", `unsafe eval is not allowed`];
                }

                try {
                    const fn = new Function("return " + base[2])();
                    if (typeof fn !== "function") {
                        return ["test-disabled", `expected function, got ${typeof fn}`];
                    }

                    const success = fn(result);
                    if (typeof success !== "boolean") {
                        return ["test-disabled", `expected boolean from check function, got ${typeof fn}`];
                    }

                    return (
                        success === !isNegated ? ["success"] :
                        success ? ["failure", `expected ${base[1]}(${JSON.stringify(result)}) to return false`] :
                        ["failure", `expected ${base[1]}(${JSON.stringify(result)}) to return true`]
                    );
                } catch (e) {
                    return ["test-disabled", `expected function to not throw an error`];
                }
            }
        }
    }

    export const test = <T extends unknown[]>(
        fn: (...args: T) => unknown,
        args: T,
        expect: t,
        allowUnsafeEval = false,
    ): TestResult => {
        let result: unknown = undefined;
        let error: string | undefined;
        let resolved = false;

        try {
            result = fn(...args);
            resolved = true;
        } catch (e) {
            if (e instanceof Error) {
                error = e.message;
            } else if (typeof e === "string") {
                error = e;
            } else if (typeof e === "object" && e !== null) {
                error = e.toString();
            } else {
                console.warn("Unexpected error", e);
                error = "unknown error";
            }
        }

        return judgeResult(expect, result, error, allowUnsafeEval);
    }

    export const testAsync = async <T extends unknown[]>(
        fn: (...args: T) => unknown,
        args: T,
        expect: t,
        allowUnsafeEval = false,
    ): Promise<TestResult> => {
        let result: unknown = undefined;
        let error: string | undefined;
        let resolved = false;

        try {
            result = await fn(...args);
            resolved = true;
        } catch (e) {
            if (e instanceof Error) {
                error = e.message;
            } else if (typeof e === "string") {
                error = e;
            } else if (typeof e === "object" && e !== null) {
                error = e.toString();
            } else {
                console.warn("Unexpected error", e);
                error = "unknown error";
            }
        }

        return judgeResult(expect, result, error, allowUnsafeEval);
    }
}

export { JsonSerializable };
