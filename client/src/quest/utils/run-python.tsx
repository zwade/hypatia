declare global {
    interface Window {
        python_result: any;
    }
}

export const runPython = <T extends any>(code: string, resultVar: string = "result") => {
    const fullScript = `
${code}

from browser import window
window.python_result = ${resultVar} # an error here probably means that you forgot to assign to \`${resultVar}\`
`;

    const __default_handler = __BRYTHON__.handle_error;
    let pythonError: Error | undefined = undefined;

    try {
        __BRYTHON__.handle_error = (err: any) => {
            pythonError = new Error(__BRYTHON__.$getattr(err, "info"));
            console.warn(__BRYTHON__.$getattr(err, "info"));
            throw err;
        };

        __BRYTHON__.meta_path = __BRYTHON__.$meta_path.slice()
        if(!__BRYTHON__.use_VFS){
            __BRYTHON__.meta_path.shift()
        }

        const name = "__main__.py";
        const root = __BRYTHON__.py2js(fullScript, name, name);
        const js = root.to_js();
        const script = {
            __doc__: root.__doc__,
            js: js,
            __name__: name,
            $src: fullScript,
            __file__: name
        }
        __BRYTHON__.file_cache[script.__file__] = fullScript;

        __BRYTHON__.tasks.push(["execute", script])
        __BRYTHON__.loop();
    } catch (e) {
        throw pythonError ?? e;
    } finally {
        __BRYTHON__.handle_error = __default_handler;
    }

    const result = window.python_result as any;
    delete window.python_result;

    return result as T;
}

(window as any).runPython = runPython;