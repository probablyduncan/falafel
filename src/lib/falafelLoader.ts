import falafel from "../data/falafel_list.json";
import type { FalafelPlace } from "./falafelFetcher";
import sortFalafel from "./sortFalafel";
import { validateFalafel } from "./validateFalafel";

let _falafel: Omit<typeof falafel, "entries"> & {
    entryArr: FalafelPlace[];
    entryMap: Record<string, FalafelPlace>;
};

export default function getFalafel() {

    if (!_falafel) {
        const entryArr = sortFalafel(Object.values(falafel.entries)) as FalafelPlace[];
        const entryMap = entryArr.reduce((m, p) => {
            m[p.cacheKey] = p;
            return m;
        }, {} as Record<string, FalafelPlace>);

        const errors = validateFalafel(entryArr);
        if (errors.length) {
            console.error(
                JSON.stringify(
                    errors.map((e) => ({ name: e.entry.name, errors: e.errors })),
                    null,
                    2,
                ),
            );
        }

        _falafel = {
            ...falafel,
            entryArr,
            entryMap,
        }
    }

    return _falafel;
}