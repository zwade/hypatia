import * as React from "react";
import { Input } from "react-pwn";

import { QuizContext } from "../../../../providers/quiz-provider";
import { QuizIdContext } from "./providers/quiz-id-provider";
import { QuizQuestionContext, QuizQuestionData } from "./providers/quiz-question-provider";

export interface Props {
    text: string;
    exact: boolean;
}

export const QuizTextInput = (props: Props) => {
    const quizQuestionContext = React.useContext(QuizQuestionContext) as QuizQuestionData<"text">;
    const quizId = React.useContext(QuizIdContext);
    const quiz = React.useContext(QuizContext);
    const [disabled, setDisabled] = React.useState(false);
    const [id, setId] = React.useState<string | undefined>();
    const [value, setValue] = React.useState<string | undefined>();

    React.useEffect(() => {
        const id = quizQuestionContext.register({
            type: "text",
            checker,
            onChange: setValue,
        });

        // I feel a bit gross, but in this case hoisting makes things easier
        function checker(value: string) {
            if (props.exact) {
                return value === props.text;
            } else {
                const regex = new RegExp(props.text, "i");
                return regex.exec(value) !== null;
            }
        }

        if (id === undefined) {
            setDisabled(true);
            return;
        }

        setId(id);

        return () => { quizQuestionContext.unregister(id); };
    }, []);

    if (id === undefined || disabled) {
        return (
            <Input value={disabled ? props.text : value} disabled={disabled}/>
        );
    }
    return (
        <Input
            value={value}
            onChange={(v) => quizQuestionContext.update(id, v)}
            onEnter={() => {
                if (quizId !== null) {
                    quiz.check(quizId);
                }
            }}
        />
    )
}