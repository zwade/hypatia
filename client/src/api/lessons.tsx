const get = async <T extends any>(url: string) => {
    const req = await fetch(url);
    if (req.ok) {
        const result = await req.json();
        return result as T;
    }

    const error = await req.text();
    throw new Error(error);
}

const getText = async (url: string) => {
    const req = await fetch(url);
    if (req.ok) {
        const result = await req.text();
        return result;
    }

    const error = await req.text();
    throw new Error(error);
}

export type Modules = {
    [module: string]: {
        [lesson: string]: number;
    }
}


export namespace API {
    export namespace Modules {
        export const modules = () => get<Modules>("/modules");
        export const page = (module: string, lesson: string, page: number) => getText(`/modules/${module}/${lesson}/${page}.md`);
    }
}