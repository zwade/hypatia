import { Service, Connection } from "@hypatia-app/backend";
import { Env, sleep, StableStream, Tracker } from "@hypatia-app/common";
import * as docker from "dockerode";
import * as portfinder from "portfinder";
import * as WebSocket from "ws";
import * as net from "net";
import * as crypto from "crypto";

const quillLabel = "QUILL_MANAGED";
const quillValue = "true";
const quillToken = "QUILL_TOKEN"
const quillCreatedAt = "QUILL_CREATED_AT"

const hmacSecret = Env.string("QUILL_HMAC_SECRET", { default: "quill-hmac-secret" });

export class Container {
    private info;
    private container;
    private tracker;

    public get id() {
        return this.info.Labels[quillToken];
    }

    public constructor(info: docker.ContainerInfo, container: docker.Container) {
        this.info = info;
        this.container = container;

        this.tracker = new Tracker(() => {
            console.log("Lost all connections, stopping container");
            this.stop().catch(() => {});
        }, 5_000);
    }

    private bind(left: StableStream<Buffer, Buffer>, right: StableStream<Buffer, Buffer>) {
        left.bind(right, true);
        right.bind(left, true);

        this.tracker.track(left, false);
        this.tracker.track(right, false);
    }

    public async getStatus() {
        const status = await this.container.inspect();
        return status.State;
    }

    public async start() {
        await this.container.start();
    }

    public async stop() {
        await this.container.stop();
    }

    public async bindTty(ws: StableStream<Buffer, Buffer>) {
        const stream = (await this.container.attach({ stream: true, stdout: true, stderr: true, stdin: true, logs: true })) as net.Socket;
        const socket = StableStream.fromSocket(stream);
        this.bind(socket, ws);
    }

    public async bindPort(ws: StableStream<Buffer, Buffer>, port: number) {
        const inspection = await this.container.inspect();
        const ports = inspection.HostConfig.PortBindings as Record<`${number}/tcp`, { HostPort: `${number}` }[]>;

        const portObj = ports[`${port}/tcp`]?.[0];

        const createConnection = (port: number, addr: string, maxTimeout = 60_000) => {
            const startTime = Date.now();
            const createPromise = () => new Promise<net.Socket>((resolve, reject) => {
                if (Date.now() - startTime > maxTimeout) {
                    return reject(new Error("Timed out while connecting to local socket"));
                }

                const conn = net.createConnection(port, addr);

                let failed = false;

                const errorHandler = (e: any) => {
                    console.log("Connection failed", e);
                    failed = true;

                    conn.off("error", errorHandler);
                    conn.off("close", errorHandler);
                    conn.destroy();

                    resolve(sleep(1000).then(() => createPromise()));
                }

                conn.on("error", errorHandler);
                conn.on("close", errorHandler);
                conn.on("connect", async () => {
                    // There's a race where it will connect then immediately close
                    await sleep(100);
                    if (failed) return;

                    console.log("Connected to", port, addr);

                    conn.off("error", errorHandler);
                    conn.off("close", errorHandler);
                    resolve(conn);
                });
            });

            return createPromise();
        }

        if (portObj) {
            const connection = await createConnection(parseInt(portObj.HostPort, 10), "localhost");
            const socket = StableStream.fromSocket(connection);
            this.bind(socket, ws);
        } else {
            const ipAddr = Object.values(this.info.NetworkSettings.Networks)[0].IPAddress;
            const connection = await createConnection(port, ipAddr);
            const socket = StableStream.fromSocket(connection);
            this.bind(socket, ws);
        }
    }

    public async resize(rows: number, cols: number) {
        await this.container.resize({ w: rows, h: cols });
    }
}

export class ContainerManager {
    private exposePorts;
    private docker;
    private _cache = new Map<string, Container>();

    public constructor(exposePorts?: boolean) {
        this.docker = new docker();
        this.exposePorts = exposePorts ?? false;
    }

    public async getVolume(user: string, name: string) {
        const volumeName = crypto.createHmac("sha256", hmacSecret).update(`${user}-${name}`).digest("hex");
        try {
            const volume = await this.docker.getVolume(volumeName).inspect();
            return volume;
        } catch (e: any) {
            if (typeof e.statusCode !== "number" || e.statusCode !== 404) {
                throw e;
            }
        }

        const volume = await this.docker.createVolume({
            Name: volumeName,
            Labels: {
                [quillLabel]: quillValue,
            }
        });

        return await this.docker.getVolume(volumeName).inspect();
    }

    public async getContainers() {
        const filters = JSON.stringify({
            label: [`${quillLabel}=${quillValue}`],
        });

        const currentContainers = await this.docker.listContainers({ filters, all: true });
        const containers = currentContainers.map((container) => new Container(container, this.docker.getContainer(container.Id)));

        this._cache.clear();
        for (const container of containers) {
            this._cache.set(container.id, container);
        }
    }

    public async findContainer(token: string) {
        if (this._cache.has(token)) {
            return this._cache.get(token)!;
        }

        const filters = JSON.stringify({
            label: [
                `${quillLabel}=${quillValue}`,
                `${quillToken}=${token}`
            ],
        });

        const currentContainers = await this.docker.listContainers({ filters, all: true });
        if (currentContainers.length === 0) {
            console.log("unable to find containers???");
            return undefined;
        }

        const container = new Container(currentContainers[0], this.docker.getContainer(currentContainers[0].Id));
        this._cache.set(container.id, container);
        return container;
    }

    public async createContainer(token: string, user: string, service: Service.t) {
        console.info("Creating new container ", { token, user, service });
        if (service.kind !== "docker") {
            throw new Error("Unable to start non-docker container");
        }

        let exposedPorts: Record<`${number}/tcp`, {}> = {};
        let portBindings: Record<`${number}/tcp`, [{ HostPort: `${number}` }]> = {};
        if (this.exposePorts) {
            const neededPortsPromise = service.connections
                ?.filter((conn): conn is Connection.Http | Connection.Socket => conn.kind === "http" || conn.kind === "socket")
                .map(async (conn) => [conn.port, await portfinder.getPortPromise()] as const)
                ?? [];

            const neededPorts = await Promise.all(neededPortsPromise);
            for (const [port, hostPort] of neededPorts) {
                exposedPorts[`${port}/tcp`] = {};
                portBindings[`${port}/tcp`] = [{ HostPort: `${hostPort}` }];
            }
        }

        let Binds: `${string}:${string}`[] = [];
        for (const volume of service.volumes ?? []) {
            const vol = await this.getVolume(user, volume.name);
            Binds.push(`${vol.Name}:${volume.path}`);
        }

        const dockerodeContainer = await this.docker.createContainer({
            Image: service.image,
            Cmd: service.command ? service.command : [],
            Tty: true,
            AttachStderr: true,
            AttachStdout: true,
            AttachStdin: true,
            OpenStdin: true,
            User: "root",
            Labels: {
                [quillLabel]: quillValue,
                [quillToken]: token,
            },
            ExposedPorts: exposedPorts,
            HostConfig: {
                PortBindings: portBindings,
                Binds,
                // Memory: 256 * 1024 * 1024,
                // NanoCpus: 500_000_000,
            } as any,
        });

        await dockerodeContainer.start();

        const info = await this.docker.listContainers({ all: true, filters: JSON.stringify({ id: [dockerodeContainer.id] }) });
        return new Container(info[0], dockerodeContainer);
    }
}