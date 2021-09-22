import { Plugin } from "unified"
import { Extension } from "micromark-util-types";
import { codes } from "micromark-util-symbol/codes";
import { Tokenizer, Code, Token, Event } from "micromark-util-types";
import { Extension as MdastExtension, Handle } from "mdast-util-from-markdown";

import { genUtils, isEOL, mapTag, runImmediately } from "./parseUtils";

type Handles = Record<string, Handle>;

export interface MdastQuiz<T> {
    type: T;
    children: unknown[]
    data: {
        hName: T;
        hProperties: Record<string, any>
    };
}

type QuizMultipleChoiceOptionToken = {
    correct: boolean;
} & Token;

type QuizTextInputToken = {
    kind: "equality";
    text: string;
    exact: boolean;
} & Token;

type QuizToken = {
    id: number;
} & Token;

export enum QuizElements {
    Quiz = "quiz",

    QuizLineStart = "quiz-line-start",
    QuizHeader = "quiz-header",

    QuizHint = "quiz-hint",
    QuizQuestion = "quiz-question",
    QuizContent = "quiz-content",

    QuizTextInput = "quiz-text-input",
    QuizRadioInput = "quiz-radio-input",
    QuizCheckboxInput = "quiz-checkbox-input",
}

declare module 'mdast' {
    type BCM = {
        [K in
            | QuizElements.QuizHeader
            | QuizElements.QuizQuestion
            | QuizElements.QuizHint
        ]: MdastQuiz<QuizElements>;
    }

    interface BlockContentMap extends BCM { }
}

const quizParser = (): Extension => {
    let quizNumber = 0;

    const tokenizeQuizParams: Tokenizer = function (effect, ok, nok) {
        const utils = genUtils(this, effect);

        const fn = utils.withSteps(
            (ok, nok) => (c) => {
                if (!isEOL(this.previous)) {
                    return nok(c);
                }
                return ok(c, false);
            },
            utils.enter(QuizElements.QuizLineStart),
            utils.expect("?"),
            utils.exit(QuizElements.QuizLineStart),
            utils.branch({
                [codes.exclamationMark]: utils.withNamedSteps(
                    QuizElements.QuizHint,
                    (t) => { },
                    utils.expect("!"),
                    utils.enter(QuizElements.QuizContent),
                    utils.readUntil(["\x00", "\n\n", "\n?"], (c) => {
                        if (isEOL(c)) {
                            const token = effect.exit(QuizElements.QuizContent);
                            effect.enter(QuizElements.QuizContent);
                            token.contentType = "flow";
                        }
                    }),
                    utils.exit(QuizElements.QuizContent, (t) => { t.contentType = "text" }),
                ),
                [codes.colon]: utils.withNamedSteps(
                    QuizElements.QuizQuestion,
                    (t) => { },
                    utils.expect(":"),
                    utils.enter(QuizElements.QuizContent),
                    utils.readUntil(["\x00", "\n\n", "\n?"], (c) => {
                        if (isEOL(c)) {
                            const token = effect.exit(QuizElements.QuizContent);
                            effect.enter(QuizElements.QuizContent);
                            token.contentType = "text";
                        }
                    }),
                    utils.exit(QuizElements.QuizContent, (t) => { t.contentType = "text" }),
                ),
            }),
        )

        return utils.apply(fn, ok, nok);
    }


    const tokenizeBlock = (isStart: boolean): Tokenizer => function (effect, ok, nok) {
        const utils = genUtils(this, effect);

        const header = () => {
            return utils.withSteps(
                (ok, nok) => (c) => {
                    if (isStart) {
                        if (utils.findParent("quiz") !== undefined) {
                            return nok(c);
                        }
                        effect.enter("quiz");
                    }
                    return ok(c, false);
                },
                utils.enter(QuizElements.QuizLineStart),
                utils.expect("??"),
                utils.exit(QuizElements.QuizLineStart),
            )
       }

       return utils.apply(header(), ok, nok);
    }

    const tokenizeStart: Tokenizer = function (effect, ok, nok) {
        return tokenizeBlock(true).bind(this)(effect, ok, nok);
    }

    const tokenizeCont: Tokenizer = function (effect, ok, nok) {
        return effect.attempt(
            // { tokenize: tokenizeBlock(false).bind(this) },
            { tokenize: function (effect, ok, nok) { return (c) => isEOL(c) ? nok(c) : ok(c) } },
            ok,
            nok
        );
    }

    const tokenizeTextInput: Tokenizer = function (effect, ok, nok) {
        const utils = genUtils(this, effect);

        const equals = () => {
            const question: string[] = [];
            let exact = false;
            const log = (c: Code) => {
                if (c !== null && c > 0) {
                    question.push(String.fromCharCode(c));
                }
            }

            return utils.withNamedSteps(
                QuizElements.QuizTextInput,
                (t: QuizTextInputToken) => {
                    t.text = question.join("").trim();
                    t.exact = exact;
                },

                utils.expect("="),
                utils.branch(
                    {
                        [codes.equalsTo]: utils.withSteps(
                            utils.expect("=", () => exact = true),
                            utils.expect("="),
                            utils.readLine(log),
                        ),
                        [codes.tilde]: utils.withSteps(
                            utils.expect("~"),
                            utils.expect("="),
                            utils.readLine(log),
                        )
                    }
                ),
            );
        }

        return utils.apply(equals(), ok, nok);
    }

    const tokenizeMultipleChoice = (kind: "checkbox" | "radio"): Tokenizer => function (effect, ok, nok) {
        const utils = genUtils(this, effect);

        const open = kind === "checkbox" ? "[" : "(";
        const close = kind === "checkbox" ? "]" : ")";

        let isCorrect = false;

        const fn = utils.withNamedSteps(
            kind === "checkbox" ? QuizElements.QuizCheckboxInput : QuizElements.QuizRadioInput,
            (t: QuizMultipleChoiceOptionToken) => { t.correct = isCorrect; },
            utils.expect(open),
            utils.branch({
                [codes.space]: utils.expect(" "),
                [codes.asterisk]: utils.expect("*", () => isCorrect = true),
            }),
            utils.expect(close),
            utils.enter(QuizElements.QuizContent),
            utils.readUntil(["\n"]),
            runImmediately(utils.exit(QuizElements.QuizContent, (t) => { t.contentType = "text" })),
        );

        return utils.apply(fn, ok, nok);
    }

    return {
        text: {
            [codes.equalsTo]: {
                tokenize: tokenizeTextInput,
            },
            [codes.leftSquareBracket]: {
                tokenize: tokenizeMultipleChoice("checkbox"),
            },
            [codes.leftParenthesis]: {
                tokenize: tokenizeMultipleChoice("radio"),
            },
        },
        flow: {
            [codes.questionMark]: {
                tokenize: tokenizeQuizParams,
                add: "before",
            },
        },
        document: {
            [codes.questionMark]: {
                tokenize: tokenizeStart,
                continuation: {
                    tokenize: tokenizeCont,
                },
                exit(effect) {
                    const t = effect.exit(QuizElements.Quiz) as QuizToken;
                    t.id = quizNumber;
                    quizNumber++;
                },
            },
        },
        disable: {
            null: ["codeIndented"]
        }
    }
}

function fromMarkdown(): MdastExtension {
    const enter: Handles = {
        [QuizElements.Quiz](t) {
            const token = t as QuizToken;
            this.enter({
                type: QuizElements.Quiz,
                data: {
                    hName: QuizElements.Quiz,
                    hProperties: {
                        type: "quiz",
                        id: token.id,
                    }
                },
                children: [],
            }, token)
        },
        [QuizElements.QuizTextInput](t) {
            const token = t as QuizTextInputToken;
            this.enter({
                type: QuizElements.QuizTextInput,
                children: [],
                data: {
                    hName: QuizElements.QuizTextInput,
                    hProperties: {
                        type: QuizElements.QuizTextInput,
                        text: token.text,
                        exact: token.exact,
                    }
                }
            }, t);
        },
        [QuizElements.QuizCheckboxInput](t) {
            const token = t as QuizMultipleChoiceOptionToken;
            this.enter({
                type: QuizElements.QuizCheckboxInput,
                children: [],
                data: {
                    hName: QuizElements.QuizCheckboxInput,
                    hProperties: {
                        type: QuizElements.QuizCheckboxInput,
                        correct: token.correct,
                    }
                }
            }, t);
        },
        [QuizElements.QuizRadioInput](t) {
            const token = t as QuizMultipleChoiceOptionToken;
            this.enter({
                type: QuizElements.QuizRadioInput,
                children: [],
                data: {
                    hName: QuizElements.QuizRadioInput,
                    hProperties: {
                        type: QuizElements.QuizRadioInput,
                        correct: token.correct,
                    }
                }
            }, t);
        },
    }

    const exit: Handles = {
        [QuizElements.Quiz](t) { this.exit(t) },
        [QuizElements.QuizTextInput](t) { this.exit(t) },
        [QuizElements.QuizCheckboxInput](t) { this.exit(t) },
        [QuizElements.QuizRadioInput](t) { this.exit(t) },
    }

    for (const type of [QuizElements.QuizQuestion, QuizElements.QuizHint, QuizElements.QuizHeader] as const) {
        enter[type] = function(t) {
            this.enter({
                type,
                children: [],
                data: {
                    hName: type,
                    hProperties: {
                        node: t,
                    }
                }
            }, t)
        }

        exit[type] = function(t) {
            this.exit(t)
        }
    }

    return {
        enter,
        exit,
    }
}


export const QuizPlugin: Plugin = function () {
    const data = this.data();

    const add = (field: string, value: unknown) => {
        const list = (data[field] ? data[field] : (data[field] = [])) as unknown[];
        list.push(value);
    }

    add("micromarkExtensions", quizParser());
    add("fromMarkdownExtensions", fromMarkdown())
}