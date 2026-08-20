import * as mapLibreGL from "maplibre-gl";
import type { GeoJSONFalafelFeature } from "../pages/falafel.geojson";

const minZoom = 2;
const maxZoom = 18;
const initialPosition: Pick<mapLibreGL.MapOptions, "center" | "zoom"> = {
    center: [-0.1, 51.5],
    zoom: 10,
}

const map = new mapLibreGL.Map({
    container: "map",
    // style: "https://tiles.versatiles.org/assets/styles/colorful/style.json",
    // style: "https://demotiles.maplibre.org/style.json",
    // style: "https://americanamap.org/style.json",
    // style: "https://tiles.openfreemap.org/styles/positron",
    style: {
        version: 8,
        sources: {
            "raster-tiles": {
                type: "raster",
                tiles: [
                    "https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
                    "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
                    "https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
                    "https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
                ],
                tileSize: 256,
            },
        },
        layers: [{ id: "raster-layer", type: "raster", source: "raster-tiles" }],
    },

    maxZoom,
    minZoom,
    ...initialPosition,
    fadeDuration: 0,
    attributionControl: false,
});

map.on("load", async () => {
    map.addSource("falafel", {
        type: "geojson",
        data: "/falafel.geojson",
        cluster: true,
        clusterMaxZoom: maxZoom - 1,
        clusterRadius: 60,
    });

    type FalafelEntryDict = Record<string, GeoJSONFalafelFeature["properties"] & { coordinates: [number, number] }>;

    const falafelSource = map.getSource("falafel") as mapLibreGL.GeoJSONSource;
    const falafelFeatures = (await falafelSource.getData()).features as GeoJSONFalafelFeature[];
    const falafelDict: FalafelEntryDict = {};
    for (let i = 0; i < falafelFeatures.length; i++) {
        const feature = falafelFeatures[i];
        falafelDict[feature.properties.id] = {
            ...feature.properties,
            coordinates: feature.geometry.coordinates,
        }
    }

    const falafelIcon = await map.loadImage(`/favicon-frames/a32-5.png`);
    map.addImage("falafel-icon", falafelIcon.data);
    const wrapIcon = await map.loadImage(`/wrap_32.png`);
    map.addImage("wrap-icon", wrapIcon.data);

    map.addLayer({
        id: "falafel",
        type: "symbol",
        source: "falafel",
        filter: ["!", ["has", "point_count"]],
        layout: {
            "icon-image": "falafel-icon",
            "text-field": ["get", "shortName"],
            "text-font": ["Kyroh"],
            "text-offset": [0, 1.25],
            "text-anchor": "top",
            "icon-size": 0.8,
        },
        paint: {
            "text-color": [
                "case",
                ['boolean', ['feature-state', 'hover'], false],
                "#fafaff",
                "#210c0c",
            ],
            "text-halo-color": [
                "case",
                ['boolean', ['feature-state', 'hover'], false],
                "#ff7221b2",
                "#fafaffcc",
            ],
            "text-halo-blur": 4,
            "text-halo-width": 4,
        }
    });

    map.addLayer({
        id: "wraps",
        type: "symbol",
        source: "falafel",
        filter: ["has", "point_count"],
        layout: {
            "icon-image": "wrap-icon",
            "icon-rotate": 18,
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["Kyroh"],//["Noto Sans Bold"],
            "text-offset": [-0.3, 1.3],
            "icon-size": 1.2,
        },
        "paint": {
            "text-color": [
                "case",
                ['boolean', ['feature-state', 'hover'], false],
                "#210c0c",
                "#210c0cbb",
            ],
            "text-halo-color": "#FEDEBB",
            "text-halo-width": 1,
            "text-halo-blur": 1,
        }
    });

    // inspect a cluster on click
    map.on("click", "wraps", async (e) => {
        const features = map.queryRenderedFeatures(e.point, {
            layers: ["wraps"],
        });
        const clusterId = features[0].properties.cluster_id;
        const source = map.getSource(
            "falafel",
        ) as mapLibreGL.GeoJSONSource;

        const zoom = await source.getClusterExpansionZoom(clusterId);
        const extraZoom = (maxZoom - zoom) * 0.2;
        map.easeTo({
            around: features[0].geometry.coordinates,
            zoom: zoom + extraZoom,
        });
    });

    addMapFalafelFocusListener(id => {
        if (id in falafelDict) {
            map.easeTo({
                center: falafelDict[id].coordinates,
                zoom: 15,
            });
        }
    });

    map.on("click", "falafel", (e) => {
        onClickMapFalafel(e.features![0].properties.id);
        const coordinates = e.features![0].geometry.coordinates.slice();
        const name = e.features![0].properties.name;
        const address = e.features![0].properties.address;

        // Ensure that if the map is zoomed out such that
        // multiple copies of the feature are visible, the
        // popup appears over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] +=
                e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapLibreGL.Popup()
            .setLngLat(coordinates)
            .setHTML(`${name}<br>${address}`)
            .addTo(map);

    });

    let hoverFeatureId: mapLibreGL.GeoJSONFeatureId | null = null;
    function updateHover(e?: {
        features?: mapLibreGL.MapGeoJSONFeature[];
    }) {
        if (hoverFeatureId) {
            map.setFeatureState(
                { source: "falafel", id: hoverFeatureId },
                { hover: false }
            );
        }

        hoverFeatureId = e?.features?.at(0)?.id ?? null;
        if (hoverFeatureId) {
            map.setFeatureState(
                { source: "falafel", id: hoverFeatureId },
                { hover: true }
            );
        }
    }

    map.on("mousemove", "falafel", updateHover);
    map.on("mousemove", "wraps", updateHover);

    map.on("mouseenter", "falafel", (e) => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on("mouseleave", "falafel", () => {
        map.getCanvas().style.cursor = '';
        updateHover();
    });

    map.on("mouseenter", "wraps", (e) => {
        map.getCanvas().style.cursor = 'zoom-in';
    });
    map.on("mouseleave", "wraps", () => {
        map.getCanvas().style.cursor = '';
        updateHover();
    });
});

const MAP_EVENTS = {
    ON_CLICK_MAP_FALAFEL: "onclickmapfalafel",
    ON_FOCUS_MAP_FALAFEL: "onfocusmapfalafel",
} as const;

export function focusMapFalafel(id: string) {
    window.dispatchEvent(new CustomEvent(MAP_EVENTS.ON_FOCUS_MAP_FALAFEL, {
        detail: id,
    }));
}

export function addMapFalafelFocusListener(callback: (id: string) => void) {
    window.addEventListener(MAP_EVENTS.ON_FOCUS_MAP_FALAFEL, (e: CustomEventInit<string>) => callback(e.detail ?? ""));
}

export function onClickMapFalafel(id: string) {
    window.dispatchEvent(new CustomEvent(MAP_EVENTS.ON_CLICK_MAP_FALAFEL, {
        detail: id,
    }));
}

export function addMapFalafelClickListener(callback: (id: string) => void) {
    window.addEventListener(MAP_EVENTS.ON_CLICK_MAP_FALAFEL, (e: CustomEventInit<string>) => callback(e.detail ?? ""));
}