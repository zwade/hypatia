import * as React from "react";
import { v4 as uuid } from "uuid";

import { QuestionStatus, QuizContext } from "../../../../providers/quiz-provider";
import { QuizIdContext } from "./providers/quiz-id-provider";
import { GetValue, OptionData, OptionType, QuizQuestionContext, QuizQuestionData, UnknownQuizQuestionData, useQuizStatus } from "./providers/quiz-question-provider";

export interface Props {
    children: React.ReactNode;
}

export const QuizQuestion = <T extends OptionType>(props: Props) => {
    const quiz = React.useContext(QuizContext);
    const quizId = React.useContext(QuizIdContext);
    const [currentType, setType] = React.useState<T | undefined>(undefined);
    const [value, setValue] = React.useState<GetValue<T> | undefined>(undefined);
    const ids = React.useRef<Map<string, OptionData<T>>>(new Map());

    const isCorrect =
        value !== undefined &&
        [...ids.current.values()].every((opt) => opt.checker(value));

    useQuizStatus(quizId ?? -1, isCorrect, value);

    const register = (options: OptionData<T>) => {
        for (const alt of ids.current.values()) {
            if (options.type !== alt.type) {
                console.warn("Attempting to mix quiz question types. Disabling element");
                return undefined;
            }
        }

        setType(options.type);

        const id = uuid();
        ids.current.set(id, options);
        return id;
    }

    const unregister = (id: string) => {
        ids.current.delete(id);
    }

    const update = (id: string, value: GetValue<T>) => {
        setValue(value);
        for (const [optId, opt] of ids.current) {
            opt.onChange(value);
        }

        if (quizId !== null) {
            quiz.setStatus(quizId, QuestionStatus.Unchecked);
        }
    }

    const contextValue = {
        register,
        unregister,
        update,
        currentType
    } as UnknownQuizQuestionData

    return (
        <div className="quiz-question">
            <QuizQuestionContext.Provider value={contextValue}>
                { props.children }
            </QuizQuestionContext.Provider>
        </div>
    );
};