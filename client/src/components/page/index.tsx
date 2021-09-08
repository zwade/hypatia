import * as React from "react";
import { useParams } from "react-router";
import ReactMarkdown from "react-markdown";

import { API } from "../../api/lessons";

export interface Props {

}

export const Page = (props: Props) => {
    const { module, lesson, page } = useParams<{ module: string, lesson: string, page: string }>();
    const [pageContent, setPageContent] = React.useState<string>("");

    React.useEffect(() => {
        API.Modules.page(module, lesson, parseInt(page, 10)).then(setPageContent);
    }, [module, lesson, page]);

    return (
        <div className="page">
            <ReactMarkdown>
                { pageContent }
            </ReactMarkdown>
        </div>
    )
}