import type { PoolClient, Pool } from "pg";
import { SmartClient } from "./smart-client";

type Find<Name extends string, Dep extends DBObject<any, any, any>> =
    Dep extends { tableName: Name } ? Dep : never;

export abstract class DBObject<T = unknown, AP = unknown, Deps extends DBObject<any, any, any>[] = []> {
    public abstract tableName: string;
    public abstract version: number;

    protected abstract initialize(client: PoolClient): Promise<void>;
    protected abstract fromPostgres(row: AP): T;
    protected upgrade?: (client: PoolClient, currentVersion: number) => Promise<number> = undefined;

    protected isSystem: boolean = false;
    protected pool: Promise<Pool>;
    protected deps: { [Name in Deps[number]["tableName"]]: Find<Name, Deps[number]> };

    private _client: SmartClient<T, AP> | undefined;

    public get ready() {
        return this.pool.then(() => {});
    }

    private get client() {
        if (this._client !== undefined) return this._client;

        return this._client = new SmartClient(
            this.withClient.bind(this),
            this.tableName,
            this.fromPostgres.bind(this)
        );
    }

    protected get query() {
        return this.client.query.bind(this.client);
    }

    protected get q() {
        return this.client.q.bind(this.client);
    }

    protected get get() {
        return this.client.get.bind(this.client);
    }

    protected get get1() {
        return this.client.get1.bind(this.client);
    }

    protected get get1Opt() {
        return this.client.get1Opt.bind(this.client);
    }

    constructor(pool: Pool, dependents: Deps) {
        const deps = {} as any;
        for (const dep of dependents) {
            deps[dep.tableName] = dep;
        }
        this.deps = deps;

        // You don't get access to the pool until it's initialized
        this.pool = new Promise<Pool>(async (resolve) => {
            await this.withClient(async (client) => {
                await Promise.all(dependents.map((d) => d.ready));
                await this.initializeVersionTable(client);
                const currentVersion = await this.getCurrentVersion(client);
                try {
                    if (currentVersion === undefined) {
                        await this.initialize(client);
                    } else {
                        await this.doUpgrade(client, currentVersion);
                    }
                    await this.updateVersionNumber(client);
                } catch (e) {
                    console.error(`Initialization of ${this.tableName} failed`, e);
                }
            }, pool);
            resolve(pool);
        });
    }

   public async withClient<T>(fn: (client: PoolClient) => Promise<T>, pool?: Pool): Promise<T> {
        pool ??= await this.pool;
        const client = await pool.connect();

        try {
            const result = await fn(client);
            return result;
        } catch (e) {
            throw e;
        } finally {
            client.release();
        }
    }


    protected async transaction<Res>(fn: (client: SmartClient<T, AP>) => Promise<Res>, pool?: Pool): Promise<Res> {
        pool ??= await this.pool;
        const client = await pool.connect();

        try {
            await client.query(`BEGIN`);

            const staticSmartClient = new SmartClient(
                (fn) => fn(client),
                this.tableName,
                this.fromPostgres.bind(this),
            )

            const result = await fn(staticSmartClient);

            await client.query(`COMMIT`);
            return result;
        } catch (e) {
            await client.query(`ROLLBACK`);
            throw e;
        } finally {
            client.release();
        }
    }

    private async initializeVersionTable(client: PoolClient) {
        await client.query(`
            LOCK TABLE pg_catalog.pg_namespace;

            CREATE SCHEMA IF NOT EXISTS rd;

            CREATE TABLE IF NOT EXISTS rd.table_version (
                table_name text PRIMARY KEY,
                version integer NOT NULL
            );
        `);
    }

    private async getCurrentVersion(client: PoolClient) {
        const result = await client.query<{ version: number }>(`
            SELECT version FROM rd.table_version WHERE table_name = $1;
        `, [this.tableName]);

        return result.rows[0]?.version as number | undefined;
    }

    private async doUpgrade(client: PoolClient, startVersion: number) {
        let currentVersion = startVersion;

        while (currentVersion < this.version) {
            const lastVersion = currentVersion;
            currentVersion = await this.upgrade?.(client, currentVersion) ?? lastVersion;

            if (lastVersion === currentVersion) {
                throw new Error(`Upgrading ${this.tableName} from ${startVersion} to ${this.version} failed at step ${currentVersion}`);
            }
        }
    }

    private async updateVersionNumber(client: PoolClient) {
        await client.query(`
            INSERT INTO rd.table_version (table_name, version) VALUES ($1, $2)
            ON CONFLICT (table_name) DO UPDATE SET version = $2;
        `, [this.tableName, this.version]);
    }
}

export abstract class DBSystem extends DBObject {
    protected fromPostgres(t: unknown) {
        return t;
    }
}