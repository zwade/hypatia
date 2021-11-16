import { moduleClient } from "@hypatia-app/backend/dist/client";

const client = moduleClient(window.location.origin);

export namespace API {
    export namespace Modules {
        export const getSignedQuest = (module: string, lesson: string, file: string, signature: string) =>
            client["/modules/:module/:lesson/signed-asset/:file"].post(undefined, { signature, kind: "quest" }, { module, lesson, file });
    }
}