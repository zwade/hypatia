import { Queue, TypedEventEmitter } from "@hypatia-app/common"

export type FromApp =
    | { kind: "configuration", module: string, lesson: string, file: string, signature: string }
    | { kind: "report-requested" }

export type ToQuest = FromApp;

export type FromQuest =
    | { kind: "status-update", correct: number, total: number }
    | { kind: "loaded" }

export type ToApp = FromQuest;

export const GetMessages = <ToUs extends any, FromUs extends any>(currentWindow: Window, sourceWindow: Window) => {
    const emitter = new TypedEventEmitter<"rx" | "tx", { rx: [ToUs], tx: [FromUs] }>();

    currentWindow.addEventListener("message", (event) => {
        emitter.emit("rx", event.data as ToUs);
    });

    emitter.on("tx", (data) => sourceWindow.postMessage(data, "*"));

    return emitter;
}