import { Plugin } from "unified"
import { Extension } from "micromark-util-types";
import { codes } from "micromark-util-symbol/codes";
import { Tokenizer, Code, Token } from "micromark-util-types";
import { Extension as MdastExtension } from "mdast-util-from-markdown";

import { genUtils } from "./parseUtils";

export interface MdastQuiz {
    type: "quiz";
    data: {
        hName: "quiz";
        hProperties: Record<string, any>
    };
}

declare module 'mdast' {
    interface BlockContentMap {
        quiz: MdastQuiz;
    }
}

export type QuizCheckbox = {
    kind: "checkbox";
    values: { value: string, correct: boolean }[];
}
type QuizCheckboxToken = Token & QuizCheckbox;

export type QuizRadio = {
    kind: "radio";
    values: { value: string, correct: boolean }[];
}
type QuizRadioToken = Token & QuizRadio;

export type QuizEquality = {
    kind: "equality";
    text: string;
    exact: boolean;
}
type QuizEqualityToken = Token & QuizEquality;

export type QuizHeader = {
    text: string;
};
type QuizHeaderToken = Token & QuizHeader;

export type Quiz = {
    header: QuizHeader;
    question: QuizEquality | QuizCheckbox | QuizRadio;
    id: number;
};
type QuizToken = Token & Quiz;

const quizParser = (): Extension => {
    let quizNumber = 0;
    const tokenize: Tokenizer = function (effect, ok, nok) {
        const utils = genUtils(this, effect);

        const header = () => {
            const data: string[] = [];
            const log = (c: Code) => {
                if (c !== null && c > 0 && c !== codes.greaterThan) {
                    data.push(String.fromCharCode(c));
                }
            }

            return utils.withNamedSteps(
                "quiz-header",
                (t: QuizHeaderToken) => {
                    t.text = data.join("").trim();
                },

                utils.expect("<"),
                utils.expect("<"),
                utils.readUntil(">", log),
                utils.expect(">"),
                utils.eol,
            );
        }


        const equals = () => {
            const question: string[] = [];
            let exact = false;
            const log = (c: Code) => {
                if (c !== null && c > 0) {
                    question.push(String.fromCharCode(c));
                }
            }

            return utils.withNamedSteps(
                "equality",
                (t: QuizEqualityToken) => {
                    t.kind = "equality";
                    t.text = question.join("").trim();
                    t.exact = exact;
                },

                utils.expect("="),
                utils.branch(
                    (c) => c === codes.equalsTo,
                    utils.withSteps(
                        utils.expect("=", () => exact = true),
                        utils.expect("="),
                        utils.readLine(log),
                    ),
                    utils.withSteps(
                        utils.expect("~"),
                        utils.expect("="),
                        utils.readLine(log),
                    )
                ),
            );
        }

        const checkbox = () => {
            let activeValue = {
                data: [] as string[],
                correct: false,
            }
            const values: { value: string, correct: boolean }[] = [];
            const log = (c: Code) => {
                if (c !== null && c > 0) {
                    activeValue.data.push(String.fromCharCode(c));
                }
            }

            return utils.withNamedSteps(
                "checkbox-group",
                (t: QuizCheckboxToken) => {
                    t.kind = "checkbox";
                    t.values = values;
                },

                utils.untilEOF(
                    utils.withNamedSteps(
                        "checkbox",
                        () => {
                            const line = {
                                value: activeValue.data.join("").trim(),
                                correct: activeValue.correct,
                            }
                            values.push(line);
                            activeValue = { data: [], correct: false };
                        },
                        utils.expect("["),
                        utils.branch(
                            (c) => c === codes.asterisk,

                            utils.withSteps(
                                utils.expect("*", () => activeValue.correct = true),
                                utils.expect("]"),
                                utils.readLine(log),
                            ),
                            utils.withSteps(
                                utils.expect(" "),
                                utils.expect("]"),
                                utils.readLine(log),
                            )
                        )
                    )
                )
            );
        }

        const radio = () => {
            let activeValue = {
                data: [] as string[],
                correct: false,
            }
            const values: { value: string, correct: boolean }[] = [];
            const log = (c: Code) => {
                if (c !== null && c > 0) {
                    activeValue.data.push(String.fromCharCode(c));
                }
            }

            return utils.withNamedSteps(
                "radio-group",
                (t: QuizRadioToken) => {
                    t.kind = "radio";
                    t.values = values;
                },

                utils.untilEOF(
                    utils.withNamedSteps(
                        "radio",
                        () => {
                            const line = {
                                value: activeValue.data.join("").trim(),
                                correct: activeValue.correct,
                            }
                            values.push(line);
                            activeValue = { data: [], correct: false };
                        },
                        utils.expect("("),
                        utils.branch(
                            (c) => c === codes.asterisk,

                            utils.withSteps(
                                utils.expect("*", () => activeValue.correct = true),
                                utils.expect(")"),
                                utils.readLine(log),
                            ),
                            utils.withSteps(
                                utils.expect(" "),
                                utils.expect(")"),
                                utils.readLine(log),
                            )
                        )
                    )
                )
            );
        }


        const quiz = () => {
            return utils.withNamedSteps(
                "quiz",
                (t: QuizToken) => {
                    const header = this.events[1][1];
                    const question = this.events[3][1];
                    t.header = header as QuizHeaderToken;
                    t.question = question as unknown as QuizEquality | QuizCheckbox | QuizRadio;
                    t.id = quizNumber;
                    quizNumber++;
                },
                header(),
                utils.branch(
                    (c) => c === codes.equalsTo,
                    equals(),
                    utils.branch(
                        (c) => c === codes.leftSquareBracket,
                        checkbox(),
                        radio(),
                    ),
                ),
            );
        }

        return utils.apply(quiz(), ok, nok);
    }

    return {
        text: {
            [codes.lessThan]: {
                tokenize,
            }
        }
    }
}

function fromMarkdown(): MdastExtension {
    return {
        enter: {
            quiz(t) {
                const token = t as QuizToken;
                this.enter({
                    type: "quiz",
                    data: {
                        hName: "quiz",
                        hProperties: {
                            type: "quiz",
                            header: token.header,
                            question: token.question,
                            id: token.id,
                        }
                    },
                }, token)
            }
        },
        exit: {
            quiz(t) {
                this.exit(t);
            }
        }
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