import { getClosest, getMinZoom } from "../lib/distanceCache";
import type { FalafelPlace } from "../lib/falafelFetcher";
import getFalafel from "../lib/falafelLoader";
import { type GeoJSONFeature } from "maplibre-gl";

export type GeoJSONFalafelFeature = Pick<GeoJSONFeature, "id" | "type" | "geometry"> & {
    properties: {
        id: string;
        name: string;
        shortName: string;
        address: string;
        closestId: string;
        closestDistance: number;
        minZoom: number;
    };
}

export function GET() {
    const features: GeoJSONFalafelFeature[] = getFalafel().entryArr.map(toGeoJSONFeature);
    return new Response(
        JSON.stringify({
            type: "FeatureCollection",
            features,
        }),
    );
};

function toGeoJSONFeature(entry: FalafelPlace): GeoJSONFalafelFeature {
    const closest = getClosest(entry.cacheKey);
    const minZoom = getMinZoom(entry.cacheKey);
    return {
        id: entry.cacheKey,
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [entry.lng, entry.lat],
        },
        properties: {
            id: entry.cacheKey,
            name: entry.name,
            shortName: entry.name.length > 15 ? (entry.name.substring(0, 12) + "...") : entry.name,
            address: entry.address ?? "",
            closestId: closest.id,
            closestDistance: closest.d,
            minZoom,
        },
    };
}