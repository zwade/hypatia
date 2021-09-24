import { makeClient } from "@hypatia-app/common/dist/expedite/client";
import type { AppRouterType } from "../routes";

export const moduleClient = makeClient<AppRouterType>();