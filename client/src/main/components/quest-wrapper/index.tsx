import * as React from "react";
import { FromApp, GetMessages, ToApp, ToQuest } from "../../../quest/messages";
import { API } from "../../api";
import { usePage } from "../../hooks";
import { QuestionStatus, QuizContext } from "../../providers/quiz-provider";

export interface Props {
    module: string;
    lesson: string;
    file: string;
}

const getUri = () => {
    const uri = new URL(window.location.href);
    const hostnameBase = uri.hostname.split(".").slice(-1)[0];
    uri.hostname = `sandbox.${hostnameBase}`;
    uri.pathname = "/quest";
    return uri.toString();
}

export const QuestWrapper = (props: Props) => {
    const quiz = React.useContext(QuizContext);
    const [iframeRef, setIframeRef] = React.useState<HTMLIFrameElement | null>(null);
    const isCorrect = React.useRef(false);

    // TODO(zwade): Choose an actual id here
    const id = 100;

    React.useEffect(() => {
        if (iframeRef) {
            if (iframeRef.contentWindow === null) {
                console.warn("iframe has no content window");
                return;
            }

            const emitter = GetMessages<ToApp, FromApp>(window, iframeRef.contentWindow)
            emitter.on("rx", async (msg) => {
                switch (msg.kind) {
                    case "loaded": {
                        const { module, lesson, file } = props;
                        const { value: signature } = await API.Modules.fileSignature(module, lesson, file);

                        emitter.emit("tx", {
                            kind: "configuration",
                            file,
                            lesson,
                            module,
                            signature
                        });

                        quiz.setStatus(id, QuestionStatus.Unchecked);
                        break;
                    }
                    case "status-update": {
                        const correct = msg.correct === msg.total;
                        isCorrect.current = correct;

                        quiz.setStatus(id, correct ? QuestionStatus.Correct : QuestionStatus.Incorrect);
                        quiz.forceRefresh();
                        break;
                    }
                }
            });

            const dispose = quiz.onCheck(id, () => {
                if (!isCorrect.current) {
                    emitter.emit("tx", {
                        kind: "report-requested"
                    });
                }
            });

            return () => {
                dispose();
            }
        }
    }, [iframeRef]);

    return (
        <iframe
            className="quest-wrapper"
            src={getUri()}
            width="100%"
            height="100%"
            ref={setIframeRef}
        />
    )
}