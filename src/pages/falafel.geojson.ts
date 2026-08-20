import type { FalafelPlace } from "../lib/falafelFetcher";
import getFalafel from "../lib/falafelLoader";

export type GeoJSONFalafelFeature = Pick<maplibregl.GeoJSONFeature, "id" | "type" | "geometry"> & {
    properties: {
        id: string;
        name: string;
        shortName: string;
        address: string;
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
        },
    };
}