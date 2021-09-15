import * as React from "react";

export const minmax = (e: number, min: number, max: number) => Math.min(Math.max(e, min), max);


export const classes = (...args: (string | undefined)[]) => args.filter((x) => x).join(" ");

export const flatten = (child: React.ReactNode): string => {
    if (typeof child === "string" || typeof child === "number" || typeof child === "boolean") {
        return child.toString();
    }

    if (child === null || child === undefined) {
        return "";
    }

    if (Array.isArray(child)) {
        return child.map(flatten).reduce((acc, d) => acc + d, "");
    }

    if ("children" in child) {
        return flatten(child.children);
    }

    if ("props" in child && "children" in child.props) {
        return flatten(child.props.children);
    }

    console.warn("Bad children", child);

    return "";
}

export const genArray = <T extends any>(n: number, f: (i: number) => T) =>
    Array.from(new Array(n), (_, i) => f(i));