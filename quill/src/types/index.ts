export namespace ControlProtocol {
    export type Capability = {
        kind: string;
        features: string[];
    }

    export type Capabilities = {
        teams?: Record<string, Capability[]>;
        users?: Record<string, Capability[]>;

    }

    export type FromServer =
        | { kind: "request-session", requestToken: string, userId: string, capability: Capability, rows: number, cols: number }
        | { kind: "update-session", sessionToken: string, rows: number, cols: number }

    export type FromClient =
        // Notes, capabilities must not be trusted. They should
        // be stored in the database and verified by the server.
        | { kind: "register", token: string, capabilities: Capabilities }
        | { kind: "session-response", requestToken: string, accepted: boolean }
}