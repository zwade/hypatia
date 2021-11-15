import { Marshaller, M } from "@zensors/sheriff";
import { Set as ISet } from "immutable";

export namespace JsonSerializable {
    export type t =
        | number
        | string
        | boolean
        | null
        | t[]
        | { [key: string]: t };

    export const MJsonSerializable: Marshaller<t> = M.rec<t>((self) => M.union(
        M.str,
        M.num,
        M.bool,
        M.nul,
        M.arr(self),
        M.record(self)
    ));

   export const equal = (a: t, b: t): boolean => {
        if (typeof a !== typeof b) {
            return false;
        }

        if (a === b) {
            return true;
        }

        if (typeof a !== "object" || typeof b !== "object") {
            return false;
        }

        if (a === null || b === null) {
            return false;
        }

        if ((a as any).__proto__ !== (b as any).__proto__) {
            return false;
        }

        const aKeys = ISet(Object.keys(a));
        const bKeys = ISet(Object.keys(b));

        if (!aKeys.equals(bKeys)) {
            return false;
        }

        for (const key of aKeys) {
            if (!equal((a as any)[key], (b as any)[key])) {
                return false;
            }
        }

        return true;
    }

}