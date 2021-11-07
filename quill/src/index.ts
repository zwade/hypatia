import { start } from "./connector";

const main = async () => {
    while (true) {
        try {
            await start(new URL("ws://app.localhost:3002"));
        } catch (e) {
            // pass
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Lost connection, restarting");
    }
}

main();

process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection", err);
    process.exit(1);
});