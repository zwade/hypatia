import * as React from "react";
import { Expect, JsonSerializable } from "@hypatia-app/common/dist/expect";
import { List } from "immutable";
import { Button, Frame } from "react-pwn";

export interface Test {
    name: string;
    description?: string;
    input: JsonSerializable.t[],
    expect: Expect.t,
}

export interface Props {
    name: string;
    instructions: string;
    tests: Test[];
    compile: () => (...args: any[]) => unknown;
}

type TestResult = ["pending"] | Expect.TestResult;

export const TestHandler = (props: Props) => {
    const [compileError, setCompileError] = React.useState<string | null>(null);
    const [compiledFunction, setCompiledFunction] = React.useState<{ fn: (...args: any[]) => unknown } | null>(null);
    const [results, setResults] = React.useState(() => List<TestResult>(props.tests.map(() => ["pending"])));
    const [runTest, setRunTest] = React.useState<number | null>(null);

    React.useEffect(() => {
        const run = async () => {
            if (runTest !== null && compiledFunction !== null) {
                const test = props.tests[runTest];
                try {
                    const result = await Expect.testAsync(compiledFunction.fn, test.input, test.expect);
                    setResults(results.set(runTest, result));
                } catch (e) {
                    setResults(results.set(runTest, e instanceof Error ? ["failure", e.message] : ["failure", "something went wrong"]));
                } finally {
                    if (runTest === props.tests.length - 1) {
                        setRunTest(null);
                    } else {
                        setRunTest(runTest + 1);
                    }
                }
            }
        }

        run();
    }, [compiledFunction, runTest]);

    const runTests = () => {
        try {
            const compiled = props.compile();
            setCompiledFunction({ fn: compiled });
            setResults(List<TestResult>(props.tests.map(() => ["pending"])));
            setRunTest(0);
            setCompileError(null);
        } catch(e) {
            if (e instanceof Error) {
                setCompileError(e.message);
            } else {
                setCompileError("Unable to compile function");
            }
            return;
        }
    }

    return (
        <Frame className="test-handler">
            <div className="title test-handler-title">{ props.name }</div>
            <div className="test-handler-instructions">{ props.instructions }</div>
            {
                compileError ? (
                    <div className="test-handler-error">
                        <div className="test-handler-error-title">Compiler Error</div>
                        <div className="test-handler-error-inner">{ compileError }</div>
                    </div>
                ) : undefined
            }
            <div className="test-results">
                <div className="test-results-inner">
                {
                    props.tests.map((test, i) => (
                        <div key={i} className="test-result" data-result={ results.get(i)![0] }>
                            <div className="test-result-name">{ test.name }</div>
                            {
                                test.description ? (
                                    <div className="test-result-description">{ test.description }</div>
                                ) : undefined
                            }
                            {
                                results.get(i)![1] ? (
                                    <div className="test-result-error">{ results.get(i)![1] } </div>
                                ) : undefined
                            }
                        </div>
                    ))
                }
                </div>
            </div>
            <Button
                className="test-run-button"
                label="Run Tests"
                onClick={runTests}
            />
        </Frame>
    )
}