import { loadScript } from "./utils";

window.process = { ...process, release: { name: "browser" } };

// Brython plays very poorly with webpack, so we're just loading it as an external script
loadScript("https://cdnjs.cloudflare.com/ajax/libs/brython/3.10.3/brython.min.js", { async: true, defer: true })
    .then(() =>
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/brython/3.10.3/brython_stdlib.min.js", { async: true, defer: true })
    );