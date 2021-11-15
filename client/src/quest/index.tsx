import { Map as IMap } from "immutable";
import { render } from "react-dom"
import { PaletteProvider } from "react-pwn";

import { BlueGreen } from "../main/utils/palette";
import { MultiEditor } from "./components/multi-editor";
import { FileProvider } from "./providers/file-provider";

import "./index.scss";
import "./load-brython";
import { CodeRunner } from "./components/code-runner";

const App = () => {
    const templates = IMap({
        "python": `
def result(search_query):
    return search_query
        `.trim(),
        "javascript": `
function result(search_query) {
    return search_query
}
        `.trim(),
    })

    return (
        <PaletteProvider palette={BlueGreen}>
            <FileProvider templates={templates}>
                <div className="quest-app">
                    <MultiEditor/>
                    <CodeRunner
                        name={"Sample Test"}
                        instructions={"Write a program that will output a number plus one"}
                        tests={[
                            { name: "The value 2", input: [2], expect: ["toBe", 3] },
                            { name: "The value 3", input: [3], expect: ["toBeGreaterThan", 3] },
                            { name: "The value 4", input: [4], expect: ["toBeGreaterThanOrEqual", 5] },
                            { name: "The value 5", input: [5], expect: ["not", "toBe", 5] },
                        ]}
                    />
                </div>
            </FileProvider>
        </PaletteProvider>
    );
}

render(<App/>, document.getElementById("root"))