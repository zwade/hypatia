import { makeClient } from "@hypatia-app/common/dist/expedite/client";
import type { AppRouterType } from "../routes";

export const moduleClient = makeClient<AppRouterType>();
export type {
    User,
    Connection,
    Service,
    Lesson,
    Module,
    Page,
    View,
} from "../types";