import getFalafel from "../lib/falafelLoader";
import { truncateText } from "../lib/textHelpers";

export function GET() {
    const features = getFalafel().entryArr.map(f => ({
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [f.lng, f.lat],
        },
        properties: {
            id: f.cacheKey,
            name: f.name,
            shortName: f.name.length > 15 ? (f.name.substring(0, 12) + "...") : f.name,
            address: f.address,
        }
    }));
    
    return new Response(
        JSON.stringify({
            type: "FeatureCollection",
            features,
        }),
    );
};
