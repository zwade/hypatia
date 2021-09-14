import * as React from "react";

export enum QuestionStatus {
    Unchecked = "unchecked",
    Correct = "correct",
    Incorrect = "incorrect",
}

export interface QuestionContextData {
    currentStatus: Map<number, QuestionStatus>;
    setStatus: (questionId: number, status: QuestionStatus) => void;
    onCheck: (cb: () => void) => () => void;
    check: () => void;
    shouldShowHint: boolean;
    showHint: (visible: boolean) => void;
}

export const QuizContext = React.createContext<QuestionContextData>({
    currentStatus: new Map(),
    setStatus: (questionId: number, status: QuestionStatus) => {},
    onCheck: (cb: () => void) => () => {},
    check: () => {},
    shouldShowHint: false,
    showHint: () => {},
});

export interface Props {
    children: React.ReactNode;
    page: string;
}

export const QuizProvider = (props: Props) => {
    const statusRef = React.useRef(new Map<number, QuestionStatus>());
    const renameRef = React.useRef(new Set<() => void>());
    const [shouldShowHint, setShouldShowHint] = React.useState(false);
    const [_, update] = React.useState({});

    React.useEffect(() => {
        statusRef.current = new Map<number, QuestionStatus>();
        renameRef.current = new Set<() => void>();
        setShouldShowHint(false);
    }, [props.page])

    const data = {
        currentStatus: statusRef.current,
        setStatus: (questionId: number, s?: QuestionStatus) => {
            if (s === undefined) {
                statusRef.current.delete(questionId);
            } else {
                statusRef.current.set(questionId, s);
            }
            update({});
        },
        onCheck: (cb: () => void) => {
            renameRef.current.add(cb);
            return () => {
                renameRef.current.delete(cb);
            };
        },
        check: () => {
            for (const cb of renameRef.current) {
                cb();
            }
        },
        shouldShowHint,
        showHint: setShouldShowHint,
    }

    return (
        <QuizContext.Provider value={data}>
            { props.children }
        </QuizContext.Provider>
    );
}