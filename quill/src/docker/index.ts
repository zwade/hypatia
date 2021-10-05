import { Service, Connection } from "@hypatia-app/backend";
import * as docker from "dockerode";
import * as portfinder from "portfinder";
import * as WebSocket from "ws";
import * as net from "net";

const quillLabel = "QUILL_MANAGED";
const quillValue = "true";
const quillToken = "QUILL_TOKEN"

export class Container {
    private info;
    private container;
    private websockets = new Set<WebSocket>();

    public get id() {
        return this.info.Labels[quillToken];
    }

    public constructor(info: docker.ContainerInfo, container: docker.Container) {
        this.info = info;
        this.container = container;
    }

    private bind(stream: NodeJS.ReadWriteStream & { destroy: () => void }, ws: WebSocket) {
        const close = () => {
            try { stream.destroy(); } catch (e) { }
            try { ws.close(); } catch (e) { }
            this.websockets.delete(ws);
        }

        if (ws.readyState === WebSocket.CLOSED) {
            close();
            return;
        }

        stream.on("error", (err) => { console.error("Stream failed due to", err); close(); })
        stream.on("close", close);
        ws.on("close", close);

        stream.on("data", (data) => {
            ws.send(data)
        });
        ws.on("message", (data) => {
            stream.write(data as any)
        });


        this.websockets.add(ws);
    }

    public async getStatus() {
        const status = await this.container.inspect();
        return status.State;
    }

    public async start() {
        await this.container.start();
    }

    public async bindTty(ws: WebSocket) {
        const stream = await this.container.attach({ stream: true, stdout: true, stderr: true, stdin: true, logs: true });
        this.bind(stream as net.Socket, ws);
    }

    public async bindPort(ws: WebSocket, port: number) {
        const portObj = this.info.Ports.find((p) => p.PrivatePort === port);
        if (portObj) {
            const connection = net.createConnection(portObj.PublicPort, "localhost");
            this.bind(connection, ws);
        } else {
            const ipAddr = Object.values(this.info.NetworkSettings.Networks)[0].IPAddress;
            const connection = net.createConnection(port, ipAddr);
            this.bind(connection, ws);
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

        const currentContainers = await this.docker.listContainers({ filters });
        if (currentContainers.length === 0) {
            return undefined;
        }

        const container = new Container(currentContainers[0], this.docker.getContainer(currentContainers[0].Id));
        this._cache.set(container.id, container);
        return container;
    }

    public async createContainer(token: string, service: Service.t) {
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

        const dockerodeContainer = await this.docker.createContainer({
            Image: service.image,
            Cmd: service.command ? service.command : [],
            Tty: true,
            AttachStderr: true,
            AttachStdout: true,
            AttachStdin: true,
            OpenStdin: true,
            Labels: {
                [quillLabel]: quillValue,
                [quillToken]: token,
            },
            ExposedPorts: exposedPorts,
            HostConfig: {
                PortBindings: portBindings,
            }
        });

        const info = await this.docker.listContainers({ all: true, filters: JSON.stringify({ id: [dockerodeContainer.id] }) });
        return new Container(info[0], dockerodeContainer);
    }
}