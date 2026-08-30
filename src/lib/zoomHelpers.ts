import type { FalafelPlace } from "./falafelFetcher";
import getFalafel from "./falafelLoader";

export function getMinZoom(id: string) {
    const { d } = getClosest(id);
    // so I need some kind of range that gives me a zoom level

    // d25 -> z18
    // d50 -> z16
    // d400 -> z13
    // d500 -> z13
    // d693 -> z12
    // d1000 -> z12
    // d4500 -> z10
    // d6000 -> z9
    // d11500 -> z9
    // d38000 -> z7
    // d70200 -> z6
    // d100000 -> z5

    // ok so less than 30 -> z18
    // less than 50 -> z17
    // less than 100 -> z16
    // less than 500 -> z14
    // less than 700 -> z13
    // less than 2000 -> 12
    // less than 10000 -> 10
    // less than 15000 -> 8

    const map = [
        [30, 18],
        [50, 17],
        [100, 16],
        [200, 15],
        [350, 14],
        [800, 13],
        [1500, 12],
        [2500, 11],
        [6500, 10],
        [12000, 9],
        [15000, 8],
        [40000, 7],
        [80000, 6],
        [100000, 5],
        [500000, 4],
        [800000, 3],
        [1000000, 2],
    ]

    for (let [maxDistance, zoom] of map) {
        if (d <= maxDistance) {
            return zoom;
        }
    }

    return 1;
}

/**
 * Get the entry that's closest to the given entry.
 */
export function getClosest(id: string) {
    const { entryMap, entryArr } = getFalafel();
    const entry = entryMap[id];
    return entryArr.reduce((currentClosest, nextEntry) => {
        if (nextEntry.cacheKey === entry.cacheKey) {
            return currentClosest;
        }
        
        const d = getDistance(entry, nextEntry);
        if (!currentClosest.id || d <= currentClosest.d) {
            return { d, id: nextEntry.cacheKey };
        }

        return currentClosest;

    }, { d: 0, id: "" } as ({ d: number, id: string }));
}


type FalafelCoords = Pick<FalafelPlace, "lat" | "lng">;

/**
 * Computes the distance in meters between two sets of coordinates.
 */
function getDistance(f1: FalafelCoords, f2: FalafelCoords) {

    const lat1 = toRad(f1.lat);
    const lon1 = toRad(f1.lng);
    const lat2 = toRad(f2.lat);
    const lon2 = toRad(f2.lng);

    const { sin, cos, sqrt, atan2 } = Math;

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = sin(dLat / 2) * sin(dLat / 2)
        + cos(lat1) * cos(lat2)
        * sin(dLon / 2) * sin(dLon / 2);
    const c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return 6371e3 * c;
}

function toRad(degree: number) {
    return degree * Math.PI / 180;
}