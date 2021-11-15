export const runJavascript = <T extends any>(code: string, resultVar = "result") => {
    const fullCode = `
${code}

return ${resultVar};
    `;

    try {
        const result = (new Function(fullCode))();
        return result as T;
    } catch (e) {
        console.warn(e);
        return;
    }
}