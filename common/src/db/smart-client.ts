import type { PoolClient, QueryResult } from "pg";

export class SmartClient<T = unknown, AP = unknown> {
    public tableName: string;
    protected withClient;
    private fromPostgres: (row: AP) => T;

    constructor(withClient: <T>(fn: (client: PoolClient) => Promise<T>) => Promise<T>, tableName: string, fromPostgres: (row: AP) => T) {
        this.withClient = withClient;
        this.tableName = tableName;
        this.fromPostgres = fromPostgres;
    }

    public async query<T>(query: string, values?: any[]): Promise<QueryResult<T>> {
        return this.withClient((client) => {
            try {
                return client.query<T>(query, values)
            } catch (e) {
                console.error(`Query failed on ${this.tableName}`);
                console.error(query, values);
                throw e;
            }
        });
    }

    public async q<T>(strings: TemplateStringsArray, ...values: any[]): Promise<QueryResult<T>> {
        const queryString = values.reduce(
            (acc, _, i) => acc + `$${i + 1}` + strings[i + 1],
            strings[0],
        );

        return this.query<T>(queryString, values);
    }

    public async get(strings: TemplateStringsArray, ...values: any[]): Promise<T[]> {
        const result = await this.q<AP>(strings, ...values);
        return result.rows.map(this.fromPostgres);
    }

    public async get1(strings: TemplateStringsArray, ...values: any[]): Promise<T> {
        const result = await this.q<AP>(strings, ...values);
        if (result.rowCount !== 1) {
            throw new Error(`Expected to find only 1 row`);
        }
        return this.fromPostgres(result.rows[0]);
    }

    public async get1Opt(strings: TemplateStringsArray, ...values: any[]): Promise<T | undefined> {
        const result = await this.q<AP>(strings, ...values);
        if (result.rowCount === 0) return undefined;
        return this.fromPostgres(result.rows[0]);
    }
}
