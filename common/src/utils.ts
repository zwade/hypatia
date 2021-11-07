export const sleep = (t: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, t));