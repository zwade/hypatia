import * as React from "react";
import ReactMarkdown from "react-markdown";
import RehypeHighlight from "rehype-highlight";
import RehypeRaw from "rehype-raw";
import RemarkGFM from "remark-gfm";

import { API } from "../../api/lessons";
import { Navigation } from "./navigation";
import { Code, Quiz, Image, QuizCheckbox, QuizQuestion, QuizRadio, QuizTextInput, QuizHint, Notes } from "./markdown-components";
import { AttrPlugin, NotesPlugin, QuizPlugin } from "./parsers";
import { QuizProvider } from "../../providers/quiz-provider";
import { QuizNavigation } from "./quiz-navigation";
import { SettingsContext } from "../../providers/settings-provider";
import { usePage } from "../../hooks";
import { QuizElements } from "./parsers/quiz";
import { NotesElements } from "./parsers/notes-input";

import "./page.scss";
import "./material-dark.scss";

export interface Props {

}

export const Page = (props: Props) => {
    const { module, lesson, page } = usePage()!;
    const [pageContent, setPageContent] = React.useState<string>("");
    const { setPage } = React.useContext(SettingsContext);

    React.useEffect(() => {
        setPage({ module, lesson, page });
    }, [module, lesson, page]);

    React.useEffect(() => {
        API.Modules.page(module, lesson, page).then(setPageContent);
    }, [module, lesson, page]);

    return (
        <div className="page">
            <QuizProvider page={`${module}/${lesson}/${page}`}>
                <ReactMarkdown
                    className="markdown"
                    remarkPlugins={[AttrPlugin, QuizPlugin, RemarkGFM, NotesPlugin]}
                    rehypePlugins={[RehypeHighlight, [RehypeRaw, { passThrough: ["element"] }]]}
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
                    { pageContent }
                </ReactMarkdown>
                <QuizNavigation/>
                <Navigation/>
            </QuizProvider>
        </div>
    )
}