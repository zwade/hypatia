import { moduleClient } from "@hypatia-app/backend/dist/client";

const client = moduleClient(window.location.origin);

export namespace API {
    export namespace Modules {
        export const subscriptions = () => client["/modules/"].get();
        export const subscribe = (module: string) => client["/modules/q/subscription"].post(undefined, { module });
        export const mine = () => client["/modules/q/mine"].get();
        export const shared = () => client["/modules/q/shared"].get();
        export const pub = () => client["/modules/q/public"].get();

        export const get = (module: string) => client["/modules/:module"].get(undefined, undefined, { module });
        export const pageData = (module: string, lesson: string, page: string) =>
            client["/modules/:module/:lesson/:page/data"].get(undefined, undefined, { module, lesson, page });
        export const pageContent = (module: string, lesson: string, filename: string) =>
            client["/modules/:module/:lesson/:filename/file"].get(undefined, undefined, { module, lesson, filename });
        export const updateModule = (module: string, opts: { disabled?: boolean, public?: boolean }) =>
            client["/modules/:module"].post(undefined, opts, { module });

        export const fileSignature = (module: string, lesson: string, file: string) =>
            client["/modules/:module/:lesson/signed-asset/:file"].get(undefined, undefined, { module, lesson, file });

    }

    export namespace Service {
        export const connect = (module: string, lesson: string, connection: string) => client["/api/:module/:lesson/service"].post({ connection }, undefined, { module, lesson });
    }

    export namespace User {
        export const self = () => client["/api/user/"].get();
        export const logout = () => client["/api/user/logout"].post();
        export const register = (username: string, email: string, password: string) =>
            client["/api/user/register"].post(undefined, { username, email, password });
        export const login = (username: string, password: string) =>
            client["/api/user/login"].post(undefined, { username, password });
        export const resendVerification = () =>
            client["/api/user/resend-verification"].post();
        export const requestResetPassword = (email: string) =>
            client["/api/user/request-reset-password"].post(undefined, { email });
        export const resetPassword = (email: string, token: string, password: string) =>
            client["/api/user/reset-password"].post(undefined, { email, token, password });
    }
}