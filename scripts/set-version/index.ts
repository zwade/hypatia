import * as childProcess from "child_process";
import * as path from "path";
import * as fs from "fs-extra";

interface Workspace {
    location: string;
    name: string
}

interface PackageJson {
    version: string;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    peerDependencies: Record<string, string>;
    optionalDependencies: Record<string, string>;
}

const getWorkspaces = () => {
    return new Promise<Workspace[]>((resolve, reject) => {
        const workspaces = childProcess.exec("yarn workspaces list --json", (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }

            const workspaces = stdout.trim().split("\n").map((x) => JSON.parse(x));
            resolve(workspaces);
        })
    })
}

const getPackageJson = async (workspace: Workspace) => {
    const file = await fs.readFile(path.join(workspace.location, "package.json"));
    return JSON.parse(file.toString()) as PackageJson;
}

const updatePackage = async (workspaces: Set<string>, version: string, pkg: PackageJson) => {
    const updated = { ...pkg };
    updated.version = version;

    for (const prefix of ["d", "devD", "peerD", "optionalD"] as const) {
        const deps = { ...updated[`${prefix}ependencies`] };
        for (const dep of Object.keys(deps)) {
            if (workspaces.has(dep)) {
                deps[dep] = `^${version}`;
            }
        }

        updated[`${prefix}ependencies`] = deps;
    }

    return updated;
}

const savePackageJson = async (workspace: Workspace, pkg: PackageJson) => {
    await fs.writeFile(path.join(workspace.location, "package.json"), JSON.stringify(pkg, null, 4));
}

const main = async() => {
    const version = process.argv[2];
    if (version === undefined || /^\d+\.\d+\.\d+$/.test(version) === false) {
        console.error("Invalid version specification", version);
        return;
    }

    const workspaces = await getWorkspaces();
    const workspaceSet = new Set(workspaces.map((x) => x.name));
    for (const workspace of workspaces) {
        const pkg = await getPackageJson(workspace);
        const updated = await updatePackage(workspaceSet, version, pkg);
        console.log(updated);
        // await savePackageJson(workspace, updated);
    }
}

main();