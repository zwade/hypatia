import { moduleClient } from "@hypatia-app/backend/dist/client";

const client = moduleClient(window.location.origin);

export namespace API {
    export namespace Modules {
        export const modules = () => client["/modules/"].get();
        export const page = (module: string, lesson: string, page: number) =>
            client["/modules/:module/:lesson/:page.md"].get(undefined, undefined, { module, lesson, page: page.toString() });
    }
}