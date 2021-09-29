import { start } from "./connector";

const main = async () => {
    while (true) {
        try {
            await start(new URL("ws://localhost:3002"));
        } catch (e) {
            // pass;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Lost connection, restarting");
    }
}

main();