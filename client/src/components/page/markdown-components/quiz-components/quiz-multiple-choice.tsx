import * as React from "react";
import { Checkbox, Radio } from "react-pwn";

import { QuizQuestionContext, QuizQuestionData } from "./providers/quiz-question-provider";

export interface Props {
    children: React.ReactNode;
    correct: boolean;
}

export const QuizCheckbox = (props: Props) => {
    const quizQuestionContext = React.useContext(QuizQuestionContext) as QuizQuestionData<"checkbox">;
    const [disabled, setDisabled] = React.useState(false);
    const [id, setId] = React.useState<string | undefined>();
    const [value, setValue] = React.useState<Set<string>>(new Set());

    React.useEffect(() => {
        const id = quizQuestionContext.register({
            type: "checkbox",
            checker,
            onChange: setValue,
        });

        // I feel a bit gross, but in this case hoisting makes things easier
        function checker(value: Set<string>) {
            return props.correct ? value.has(id!) : !value.has(id!);
        }

        if (id === undefined) {
            setDisabled(true);
            return;
        }

        setId(id);

        return () => { quizQuestionContext.unregister(id); };
    }, []);

    return (
        <div className="multiple-choice-answer">
            {
                !id || disabled ? (
                    <Checkbox
                        disabled
                        value={disabled ? new Set([props.correct]) : new Set([])}
                        options={[{ value: true, label: props.children }]}
                    />
                ) : (
                    <Checkbox
                        value={value}
                        options={[{ value: id, label: props.children }]}
                        onChange={(value) => { quizQuestionContext.update(id, value); }}
                    />
                )
            }
        </div>
    );
}

export const QuizRadio = (props: Props) => {
    const quizQuestionContext = React.useContext(QuizQuestionContext) as QuizQuestionData<"radio">;
    const [disabled, setDisabled] = React.useState(false);
    const [id, setId] = React.useState<string | undefined>();
    const [value, setValue] = React.useState<string | undefined>();

    React.useEffect(() => {
        const id = quizQuestionContext.register({
            type: "radio",
            checker,
            onChange: setValue,
        });

        // I feel a bit gross, but in this case hoisting makes things easier
        function checker(value: string) {
            return props.correct === (value === id);
        }

        if (id === undefined) {
            setDisabled(true);
            return;
        }

        setId(id);

        return () => { quizQuestionContext.unregister(id); };
    }, []);

    return (
        <div className="multiple-choice-answer">
            {
                !id || disabled ? (
                    <Radio
                        disabled
                        value={disabled ? props.correct : undefined}
                        options={[{ value: true, label: props.children }]}
                        onChange={(value) => { }}
                    />
                ) : (
                    <Radio
                        value={value}
                        options={[{ value: id, label: props.children }]}
                        onChange={(value) => { quizQuestionContext.update(id, value); }}
                    />
                )
            }
        </div>
    );
};
