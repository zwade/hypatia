import * as React from "react";

import { QuestionStatus, QuizContext } from "../../../../../providers/quiz-provider";

export type OptionType = "checkbox" | "radio" | "text";

export type GetValue<T extends OptionType | undefined> =
    T extends "checkbox" ? Set<string> :
    T extends "radio" ? string :
    T extends "text" ? string :
    never;

export type OptionData<T extends OptionType | undefined> = {
    type: T;
    checker: (value: GetValue<T>) => boolean;
    onChange: (value: GetValue<T>) => void;
}

export interface QuizQuestionData<T extends OptionType | undefined> {
    currentType?: T;
    register: (option: OptionData<T>) => string | undefined;
    unregister: (id: string) => void;
    update: (id: string, value: GetValue<T>) => void;
}

export type UnknownQuizQuestionData =
    | QuizQuestionData<"checkbox">
    | QuizQuestionData<"radio">
    | QuizQuestionData<"text">

export const QuizQuestionContext = React.createContext<UnknownQuizQuestionData>({
    currentType: undefined,
    register: () => {
        console.warn("Attempting to use quiz option outside of a question. Disabling element");
        return undefined;
    },
    unregister: () => {},
    update: () => {},
});

export const useQuizStatus = (id: number, correct: boolean, value: unknown) => {
    const [isDirty, setIsDirty] = React.useState(true);
    const quiz = React.useContext(QuizContext);

    React.useEffect(() => {
        quiz.setStatus(id, QuestionStatus.Unchecked);
    }, []);

    React.useEffect(() => {
        return quiz.onCheck(id, () => {
            setIsDirty(false)
            quiz.setStatus(id, correct ? QuestionStatus.Correct : QuestionStatus.Incorrect);
        });
    }, [correct]);

    React.useEffect(() => {
        if (!isDirty) {
            setIsDirty(true);
            quiz.setStatus(id, QuestionStatus.Unchecked);
        }
    }, [value]);

    return (
        isDirty ? undefined :
        quiz.currentStatus.get(id)
    );
}