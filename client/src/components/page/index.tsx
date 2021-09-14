import * as React from "react";
import { useParams } from "react-router";
import ReactMarkdown from "react-markdown";
import RehypeHighlight from "rehype-highlight";
import RehypeRaw from "rehype-raw";

import { API } from "../../api/lessons";
import { Navigation } from "./navigation";

import { AttrPlugin } from "./attrs";
import { Code, Quiz } from "./markdown-components";

import "./page.scss";
import "./material-dark.scss";
import { QuizPlugin } from "./quiz";
import { QuizProvider } from "../../providers/quiz-provider";
import { QuizNavigation } from "./quiz-navigation";

export interface Props {

}

export const Page = (props: Props) => {
    const { module, lesson, page } = useParams<{ module: string, lesson: string, page: string }>();
    const [pageContent, setPageContent] = React.useState<string>("");

    React.useEffect(() => {
        API.Modules.page(module, lesson, parseInt(page, 10)).then(setPageContent);
    }, [module, lesson, page]);

    return (
        <div className="page">
            <QuizProvider page={`${module}/${lesson}/${page}`}>
                <ReactMarkdown
                    className="markdown"
                    remarkPlugins={[AttrPlugin, QuizPlugin]}
                    rehypePlugins={[RehypeHighlight, [RehypeRaw, { passThrough: ["element"] }]]}
                    components={{ code: Code, quiz: Quiz } as any}
                    skipHtml={false}
                >
                    { pageContent }
                </ReactMarkdown>
                <QuizNavigation/>
                <Navigation/>
            </QuizProvider>
        </div>
    )
}