import { start } from "./connector";

const main = async () => {
    while (true) {
        try {
            await start(new URL("ws://app.localhost:3002"));
        } catch (e) {
            // pass;
            if (e instanceof Error) {
                console.error(e.message);
            } else {
                console.error(e);
            }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Lost connection, restarting");
    }
}

main();