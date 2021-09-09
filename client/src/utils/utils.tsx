import * as React from "react";

export const minmax = (e: number, min: number, max: number) => Math.min(Math.max(e, min), max);


export const classes = (...args: (string | undefined)[]) => args.filter((x) => x).join(" ");

export const flatten = (child: React.ReactNode): string => {
    if (typeof child === "string") {
        return child;
    }

    if (Array.isArray(child)) {
        return child.map(flatten).reduce((acc, d) => acc + d, "");
    }

    return "";
}