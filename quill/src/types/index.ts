import type { Service } from "@hypatia-app/backend";

export namespace ControlProtocol {
    export type Capabilities = {
        teams?: Record<string, string[]>;
        users?: Record<string, string[]>;
    }

    export type Options = {
        rows: number;
        cols: number;
    }

    export type FromServer =
        | { kind: "request-session", token: string, userId: string, service: Service.t, options: Options }
        | { kind: "request-connection", token: string, connection: string }
        | { kind: "update-session", token: string, options: Partial<Options> }

    export type FromClient =
        // Notes, capabilities must not be trusted. They should
        // be stored in the database and verified by the server.
        | { kind: "register", token: string, capabilities: Capabilities }
        | { kind: "session-response", token: string, accepted: boolean }
}