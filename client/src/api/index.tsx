import { moduleClient } from "@hypatia-app/backend/dist/client";

const client = moduleClient(window.location.origin);

export namespace API {
    export namespace Modules {
        export const modules = () => client["/modules/"].get();
        export const pageData = (module: string, lesson: string, page: string) =>
            client["/modules/:module/:lesson/:page/data"].get(undefined, undefined, { module, lesson, page });
        export const pageContent = (module: string, lesson: string, filename: string) =>
            client["/modules/:module/:lesson/:filename/file"].get(undefined, undefined, { module, lesson, filename });
    }

    export namespace Service {
        export const connect = (module: string, lesson: string, connection: string) => client["/api/:module/:lesson/service"].post({ connection }, undefined, { module, lesson });
    }

    export namespace User {
        export const self = () => client["/api/user/"].get();
        export const register = (username: string, email: string, password: string) =>
            client["/api/user/register"].post(undefined, { username, email, password });
        export const login = (username: string, password: string) =>
            client["/api/user/login"].post(undefined, { username, password });
    }
}