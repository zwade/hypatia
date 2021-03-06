import { Router } from "@hypatia-app/common";

import { apiRouter, wsRouter } from "./api";
import { moduleRouter } from "./module";
import { baseRouter } from "./base";
import { userRouter } from "./user";

export const AppRouter = Router()
    .use("/api", apiRouter)
    .use("/api/user", userRouter)

    // We need this on a different top level path for webpack proxy
    .use("/ws-api", wsRouter)
    .use("/modules", moduleRouter)

    // Has the catch-all route
    .use("/", baseRouter);



export type AppRouterType = typeof AppRouter;

export { apiRouter, wsRouter, moduleRouter, baseRouter, userRouter };