import * as React from "react";
import ReactMarkdown from "react-markdown";
import RehypeHighlight from "rehype-highlight";
import RehypeRaw from "rehype-raw";
import RemarkGFM from "remark-gfm";
import { Loadable } from "@hypatia-app/common";

import { API } from "../../api";
import { Code, Quiz, Image, QuizCheckbox, QuizQuestion, QuizRadio, QuizTextInput, QuizHint, Notes } from "./markdown-components";
import { AllowedHtmlPlugin, AttrPlugin, NotesPlugin, QuizPlugin } from "./parsers";
import { QuizProvider } from "../../providers/quiz-provider";
import { QuizNavigation } from "./quiz-navigation";
import { QuizElements } from "./parsers/quiz";
import { NotesElements } from "./parsers/notes-input";

import "./page.scss";
import "./material-dark.scss";

export interface Props {
    module: string;
    lesson: string;
    file: string;
}

export const Markdown = (props: Props) => {
    const { module, lesson, file } = props;
    const [pageContent, setPageContent] = React.useState<Loadable<string>>(() => API.Modules.pageContent(module, lesson, file));

    React.useEffect(() => {
        if (pageContent.kind === "loading") {
            pageContent.then(setPageContent);
        }
    }, []);

    React.useEffect(() => {
        API.Modules.pageContent(module, lesson, file).then(setPageContent);
    }, [module, lesson, file]);

    if (!pageContent.value) {
        return <div className="page">Loading...</div>;
    }

    return (
        <div className="page">
            <QuizProvider page={`${module}/${lesson}/${file}`}>
                <ReactMarkdown
                    className="markdown"
                    remarkPlugins={[AttrPlugin, QuizPlugin, RemarkGFM, NotesPlugin, AllowedHtmlPlugin({ singleTags: ["br"], tags: ["u", "b", "i"], stripComments: true })]}
                    rehypePlugins={[RehypeHighlight]}
                    components={{
                        code: Code,
                        img: Image,
                        [QuizElements.Quiz]: Quiz,
                        [QuizElements.QuizQuestion]: QuizQuestion,
                        [QuizElements.QuizCheckboxInput]: QuizCheckbox,
                        [QuizElements.QuizRadioInput]: QuizRadio,
                        [QuizElements.QuizTextInput]: QuizTextInput,
                        [QuizElements.QuizHint]: QuizHint,
                        [NotesElements.Notes]: Notes,
                    } as any}
                    skipHtml={false}
                >
                    { pageContent.value }
                </ReactMarkdown>
                <QuizNavigation/>
            </QuizProvider>
        </div>
    );

}