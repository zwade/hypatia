import * as React from "react";
import { Set as ISet, Map as IMap } from "immutable";

export enum QuestionStatus {
    Unchecked = "unchecked",
    Correct = "correct",
    Incorrect = "incorrect",
}

export interface QuestionContextData {
    currentStatus: IMap<number, QuestionStatus>;
    setStatus: (questionId: number, status: QuestionStatus) => void;
    onCheck: (id: number | undefined, cb: () => void) => () => void;
    check: (id?: number) => void;
    shouldShowHint: boolean;
    showHint: (visible: boolean) => void;
}

export const QuizContext = React.createContext<QuestionContextData>({
    currentStatus: IMap<number, QuestionStatus>(),
    setStatus: (questionId: number, status: QuestionStatus) => {},
    onCheck: (id, cb) => () => {},
    check: () => {},
    shouldShowHint: false,
    showHint: () => {},
});

export interface Props {
    children: React.ReactNode;
    page: string;
}

export const QuizProvider = (props: Props) => {
    const statusRef = React.useRef(IMap<number, QuestionStatus>());
    const renameRef = React.useRef(IMap<number | undefined, ISet<() => void>>());
    const [shouldShowHint, setShouldShowHint] = React.useState(false);
    const [_, update] = React.useState({});

    React.useEffect(() => {
        statusRef.current = IMap<number, QuestionStatus>();
        renameRef.current = IMap<number | undefined, ISet<() => void>>()
        setShouldShowHint(false);
    }, [props.page])

    const data = {
        currentStatus: statusRef.current,
        setStatus: (questionId: number, s?: QuestionStatus) => {
            if (s === undefined) {
                statusRef.current = statusRef.current.delete(questionId);
            } else {
                statusRef.current = statusRef.current.set(questionId, s);
            }
            update({});
        },
        onCheck: (id: number | undefined, cb: () => void) => {
            renameRef.current = renameRef.current.update(id, (set = ISet()) => set.add(cb));
            return () => {
                renameRef.current = renameRef.current.update(id, (set = ISet()) => set.delete(cb));
            };
        },
        check: (id: number | undefined) => {
            const collection =
                id === undefined
                    ? renameRef.current
                        .valueSeq()
                        .reduce((acc, set) => acc.union(set), ISet<() => void>())
                    : renameRef.current
                        .get(id, ISet<() => void>())
                        .union(renameRef.current
                            .get(undefined, ISet<() => void>())
                        );

            for (const cb of collection) {
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