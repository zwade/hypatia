import * as React from "react";
import { Button } from "react-pwn";

import { QuestionStatus, QuizContext } from "../../providers/quiz-provider";

export interface Props {

}

export const QuizNavigation = (props: Props) => {
    const quiz = React.useContext(QuizContext);
    const [refreshToken, refresh] = React.useState({});
    const [correct, setCorrect] = React.useState(0);

    React.useEffect(() => {
        return quiz.onCheck(undefined, () => {
            refresh({});
        })
    }, [quiz]);

    React.useEffect(() => {
        const nowCorrect = [...quiz.currentStatus].reduce(
            (agg, [_, status]) => agg + (status === QuestionStatus.Correct ? 1 : 0),
            0
        )
        setCorrect(nowCorrect);
    }, [refreshToken]);

    const total = quiz.currentStatus.size;
    const percentage = Math.ceil(correct / total * 100);

    if (total === 0) {
        return null;
    }

    return (
        <div className="quiz-navigation">
            <div
                className="nav-button"
                onClick={() => quiz.showHint(!quiz.shouldShowHint)}
            >
                {
                    quiz.shouldShowHint ? "Hide Answers" :
                    "Show Answers"
                }
            </div>
            <div className="score">
                <div className="title">Quiz Status:</div>
                <div className="score">{ `${correct}/${total}` }</div>
                <div className="percentage">{ `(${percentage}%)` }</div>
            </div>
            <div
                className="nav-button"
                onClick={() => quiz.check()}
            >
                Check Answers
            </div>
        </div>
    )
}