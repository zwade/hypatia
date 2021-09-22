import * as React from "react";
import { classes } from "react-pwn";
import { QuizContext } from "../../../../providers/quiz-provider";
import { QuizIdContext } from "./providers/quiz-id-provider";

export interface Props {
    children: React.ReactNode;
}

export const QuizHint = (props: Props) => {
    const [shown, setShown] = React.useState(false);
    const quizId = React.useContext(QuizIdContext);
    const quiz = React.useContext(QuizContext);

    React.useEffect(() => {
        if (quizId !== null) {
            setShown(quiz.shouldShowHint);
        }
    }, [quiz.shouldShowHint])

    return (
        <div
            className={classes("quiz-hint", shown ? "shown" : "hidden", quizId !== null ? "as-answer" : "as-spoiler")}
            onClick={() => setShown(!shown)}
        >
            { props.children }
        </div>
    )
}