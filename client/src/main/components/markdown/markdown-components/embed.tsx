import * as React from "react";
import { classes } from "react-pwn";
import { useLocalStorage, usePage } from "../../../hooks";

export interface Props {
    kind: string;
    hoverText?: string;
    url: string;
}

export const Embed = (props: Props) => {
    switch (props.kind) {
        case "figma": {
            const url = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(props.url)}`;
            return (
                <iframe
                    src={url}
                    title={props.hoverText}
                    style={{
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        maxWidth: "800px",
                        maxHeight: "500px",
                        display: "block",
                        margin: "auto",
                    }}
                    width="100%"
                    height="100%"
                />
            );
        }
    }
}