import * as React from "react";
import { useParams } from "react-router";
import ReactMarkdown from "react-markdown";
import RehypeHighlight from "rehype-highlight";

import { API } from "../../api/lessons";
import { Navigation } from "./navigation";

import "./page.scss";
import "./material-dark.scss";
import { AttrPlugin } from "./attrs";
import { TerminalRunContext } from "../../providers/terminal-run";
import { flatten } from "../../utils/utils";

export interface Props {

}

const code = (props: { attrs?: string, className?: string, inline?: boolean, children: React.ReactNode }) => {
    const { run } = React.useContext(TerminalRunContext);

    const { attrs, children, inline, ...rest } = props;
    const attrSet = new Set(attrs?.split(/\s+/) ?? []);
    console.log(attrSet);

    const code = flatten(children);

    return (
        <>
            <code {...rest}>{ children }</code>
            {
                attrSet.has("execute")
                    ? <span className="execute-button" onClick={() => run(code)}>↪</span>
                    : null
            }
        </>
    );
}

export const Page = (props: Props) => {
    const { module, lesson, page } = useParams<{ module: string, lesson: string, page: string }>();
    const [pageContent, setPageContent] = React.useState<string>("");

    React.useEffect(() => {
        API.Modules.page(module, lesson, parseInt(page, 10)).then(setPageContent);
    }, [module, lesson, page]);

    return (
        <div className="page">
            <ReactMarkdown
                className="markdown"
                remarkPlugins={[AttrPlugin]}
                rehypePlugins={[RehypeHighlight]}
                components={{ code }}
            >
                { pageContent }
            </ReactMarkdown>
            <Navigation/>
        </div>
    )
}