import * as React from "react";
import { QuizContext } from "../../../../providers/quiz-provider";
import { QuizIdContext } from "./providers/quiz-id-provider";

export interface QuizProps {
    id: number;
    children: React.ReactNode;
}

export const Quiz = (props: QuizProps) => {
    const quiz = React.useContext(QuizContext);
    if (!Array.isArray(props.children)) {
        console.warn("Got non-array of children for quiz");
        return null
    }

    const [header, ...children] = props.children;

    return (
        <QuizIdContext.Provider value={props.id}>
            <div className="quiz">
                <div className="header">
                    <div className="quiz-status" data-correct={quiz.currentStatus.get(props.id)} />
                    <div className="quiz-title">{ header }</div>
                    <div className="check-button" onClick={() => quiz.check(props.id)} />
                </div>
                { children }
            </div>
        </QuizIdContext.Provider>
    )
}