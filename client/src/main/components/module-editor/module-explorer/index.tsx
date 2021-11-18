import * as React from "react";
import { useParams } from "react-router";
import { API } from "../../../api";
import { useLoadable } from "../../../hooks";
import { Loading } from "../../loading";

export const ModuleExplorer = () => {
    const path = useParams<{ module: string }>();
    const [module] = useLoadable(() => API.Modules.get(path.module));

    return (
        <Loading/>
    );
}