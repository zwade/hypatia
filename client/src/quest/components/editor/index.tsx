import * as React from "react";
import { editor } from "monaco-editor";

import "./index.scss"
import { useDebounce } from "../../utils";

export interface Props {
    onChange: (str: string) => void;
    language: string;
    data: string;
}

export const Editor = (props: Props) => {
    const [editorRef, setEditorRef] = React.useState<null | HTMLDivElement>(null);
    const editorInstanceRef = React.useRef<editor.IStandaloneCodeEditor | undefined>(undefined);

    const boundOnChange = React.useMemo(() => {
        return () => {
            if (editorInstanceRef.current) {
                props.onChange(editorInstanceRef.current.getValue());
            }
        }
    }, [props.onChange, editorRef]);
    const onChange = useDebounce(200, boundOnChange);

    React.useEffect(() => {
        if (editorRef !== null && editorInstanceRef.current === undefined) {
            editorInstanceRef.current = editor.create(editorRef, {
                value: props.data,
                language: props.language,
                theme: "vs-dark",
            });

            const d1 = editorInstanceRef.current.onKeyUp(onChange);
            const d2 = editorInstanceRef.current.onDidPaste(onChange);

            const observer = new ResizeObserver(() => {
                editorInstanceRef.current?.layout();
            });

            observer.observe(editorRef);

            return () => {
                d1.dispose();
                d2.dispose();
                observer.disconnect();
            }
        }
    }, [editorRef]);

    return (
        <div className="editor-container">
            <div className="editor-container-inner" ref={setEditorRef}/>
        </div>
    )
}