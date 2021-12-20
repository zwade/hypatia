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

    namespace React {
        type _CSSProperties = { [K in `--${string}`]: string | number };
        interface CSSProperties extends _CSSProperties {}
    }
}

render(<App/>, document.getElementById("root"));