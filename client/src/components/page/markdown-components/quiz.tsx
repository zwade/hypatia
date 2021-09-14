import * as React from "react";
import { Radio, Input, Checkbox } from "react-pwn";
import { QuestionStatus, QuizContext } from "../../../providers/quiz-provider";

import {
    Quiz as QuizProps,
    QuizEquality as QuizEqualityData,
    QuizCheckbox as QuizCheckboxData,
    QuizRadio as QuizRadioData,
} from "../quiz";

const useQuizStatus = (id: number, correct: boolean, value: unknown) => {
    const [isDirty, setIsDirty] = React.useState(true);
    const quiz = React.useContext(QuizContext);

    React.useEffect(() => {
        quiz.setStatus(id, QuestionStatus.Unchecked);
    }, []);

    React.useEffect(() => {
        return quiz.onCheck(() => {
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

interface QuizEqualityProps extends QuizEqualityData {
    id: number;
}

export const QuizEquality = (props: QuizEqualityProps) => {
    const [value, setValue] = React.useState("");
    const quiz = React.useContext(QuizContext);

    const correct =
        props.exact ? (value === props.text) :
        new RegExp(props.text, "i").exec(value) !== null;

    useQuizStatus(props.id, correct, value);

    const errorMessage =
        !quiz.shouldShowHint || correct ? undefined :
        props.exact ? `The correct answer is ${props.text}` :
        `Your answer must match the expression /${props.text}/i`

    return (
        <Input
            value={value}
            onChange={setValue}
            error={errorMessage}
            forceError={true}
        />
    )
}

interface QuizCheckboxProps extends QuizCheckboxData {
    id: number;
}

export const QuizCheckbox = (props: QuizCheckboxProps) => {
    const [values, setValues] = React.useState<Set<number>>(new Set());
    const quiz = React.useContext(QuizContext);

    const correct = props.values.every(({ correct }, idx) => correct === values.has(idx))

    useQuizStatus(props.id, correct, values);

    const correctNames = props.values
        .filter(({ correct }) => correct)
        .map(({ value }) => value);

    const errorMessage =
        correct || !quiz.shouldShowHint ? undefined :
        correctNames.length === 0 ? "None of these are correct" :
        correctNames.length === 1 ? `The correct answer is ${correctNames[0]}` :
        `The correct answers are ${correctNames.slice(0, -1).join(", ")} and ${correctNames.slice(-1)[0]}`;

    return (
        <div className="checkbox-answers">
            <Checkbox
                value={values}
                options={props.values.map(({ value }, idx) => ({ value: idx, label: value }))}
                onChange={setValues}
            />
            {
                !errorMessage ? undefined :
                (
                    <div className="extra-error-message">
                        {errorMessage}
                    </div>
                )
            }
        </div>
    );
}

interface QuizRadioProps extends QuizRadioData {
    id: number;
}

export const QuizRadio = (props: QuizRadioProps) => {
    const [value, setValue] = React.useState<number | undefined>(undefined);
    const quiz = React.useContext(QuizContext);

    const correct = value === props.values.findIndex(({ correct }) => correct);

    useQuizStatus(props.id, correct, value);

    const correctAnswer = props.values
        .filter(({ correct }) => correct)
        .map(({ value }) => value)
        [0];

    const errorMessage =
        !quiz.shouldShowHint || correct ? undefined :
        `The correct answer is ${correctAnswer}`

    return (
        <div className="checkbox-answers">
            <Radio
                value={value}
                options={props.values.map(({ value }, idx) => ({ label: value, value: idx }))}
                onChange={setValue}
            />
            {
                !errorMessage ? undefined :
                (
                    <div className="extra-error-message">
                        {errorMessage}
                    </div>
                )
            }
        </div>
    )
}

export const Quiz = (props: QuizProps) => {
    const quiz = React.useContext(QuizContext);
    const status = quiz.currentStatus.get(props.id)

    return (
        <div className="quiz">
            <h2 className="header">
                <span className="quiz-status" data-correct={status ?? "none"} />
                <span>{ props.header.text }</span>
            </h2>
            {
                props.question.kind === "equality" ? <QuizEquality id={props.id} {...props.question} /> :
                props.question.kind === "checkbox" ? <QuizCheckbox id={props.id} {...props.question} /> :
                props.question.kind === "radio" ? <QuizRadio id={props.id} {...props.question} /> :
                null
            }
        </div>
    )
}