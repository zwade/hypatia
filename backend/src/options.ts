// Wow  this is pretty gross!

export interface AppOptions {
    moduleDir: string;
    enabledModules: string[];
}

export let Options: AppOptions = {
    moduleDir: "./modules",
    enabledModules: ["ALL"],
}

export const setOptions = (updates: Partial<AppOptions>) => {
    Options = { ...Options, ...updates };
}