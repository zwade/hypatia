import { render } from "react-dom"
import { App } from "./components/app";

declare global {
    interface Window {
        process: {
            env: Record<string, string | undefined>
        }
    }

    interface process {
        env: Record<string, string | undefined>
    }
}

render(<App/>, document.getElementById("root"))