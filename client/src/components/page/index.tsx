import * as React from "react";
import ReactMarkdown from "react-markdown";
import RehypeHighlight from "rehype-highlight";
import RehypeRaw from "rehype-raw";
import RemarkGFM from "remark-gfm";

import { API } from "../../api";
import { Navigation } from "./navigation";
import { Code, Quiz, Image, QuizCheckbox, QuizQuestion, QuizRadio, QuizTextInput, QuizHint, Notes } from "./markdown-components";
import { AttrPlugin, NotesPlugin, QuizPlugin } from "./parsers";
import { QuizProvider } from "../../providers/quiz-provider";
import { QuizNavigation } from "./quiz-navigation";
import { SettingsContext } from "../../providers/settings-provider";
import { usePage } from "../../hooks";
import { QuizElements } from "./parsers/quiz";
import { NotesElements } from "./parsers/notes-input";
import type { Page as PageType } from "@hypatia-app/backend/dist/client";

import "./page.scss";
import "./material-dark.scss";
import { Loadable } from "@hypatia-app/common";

export interface Props {

}

export const Page = (props: Props) => {
    const { module, lesson, page } = usePage()!;
    const [pageContent, setPageContent] = React.useState<Loadable<readonly [PageType.AsWire, string]>>(() => API.Modules.page(module, lesson, page));
    const { setPage } = React.useContext(SettingsContext);

    React.useEffect(() => {
        if (pageContent.kind === "loading") {
            pageContent.then(setPageContent);
        }
    }, []);

    React.useEffect(() => {
        setPage({ module, lesson, page });
    }, [module, lesson, page]);

    React.useEffect(() => {
        console.log("Loading new data", module, lesson, page)
        API.Modules.page(module, lesson, page).then(setPageContent);
    }, [module, lesson, page]);

    if (!pageContent.value) {
        return <div className="page">Loading...</div>;
    }

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
                    { pageContent.value[1] }
                </ReactMarkdown>
                <QuizNavigation/>
                <Navigation/>
            </QuizProvider>
        </div>
    )
}