import { Router, static as expressStatic } from "express";
import * as fs from "fs-extra";
import * as path from "path";

export const baseRouter = Router();

const dist = path.join(__dirname, "../../../client/dist");

baseRouter.get("/", (req, res) => {
    res.sendFile(path.join(dist, "index.html"));
})

baseRouter.use("/assets/", expressStatic(dist));