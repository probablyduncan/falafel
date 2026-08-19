import * as mapLibreGL from "maplibre-gl";

const map = new mapLibreGL.Map({
    container: "map",
    // style: "https://tiles.versatiles.org/assets/styles/colorful/style.json",
    // style: "https://demotiles.maplibre.org/style.json",
    // style: "https://americanamap.org/style.json",
    style: "https://tiles.openfreemap.org/styles/positron",
    // style: {
    //     version: 8,
    //     sources: {
    //         "raster-tiles": {
    //             type: "raster",
    //             tiles: [
    //                 "https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    //                 "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    //                 "https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    //                 "https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    //             ],
    //             tileSize: 256,
    //         },
    //     },
    //     layers: [{ id: "raster-layer", type: "raster", source: "raster-tiles" }],
    // },

    center: [-0.1, 51.5],
    zoom: 10,
    attributionControl: false,
    maxZoom: 20,
    minZoom: 2,
    fadeDuration: 0,
});

map.addControl(new mapLibreGL.GlobeControl());

map.on("load", async () => {
    map.addSource("falafel", {
        type: "geojson",
        data: "./falafel.geojson",
        cluster: true,
        clusterMaxZoom: 20, // Max zoom to cluster points on
        clusterRadius: 60, // Radius of each cluster when clustering points (defaults to 50)
    });

    type FalafelEntryDict = Record<string, {
        id: string;
        name: string;
        address: string;
        coordinates: [number, number];
    }>;

    const falafelSource = map.getSource("falafel") as mapLibreGL.GeoJSONSource;
    const falafelFeatures = (await falafelSource.getData()).features as mapLibreGL.GeoJSONFeature[];
    const falafelDict: FalafelEntryDict = {};
    for (let i = 0; i < falafelFeatures.length; i++) {
        const feature = falafelFeatures[i];
        falafelDict[feature.properties.id] = {
            id: feature.properties.id,
            name: feature.properties.name,
            address: feature.properties.address,
            coordinates: feature.geometry.coordinates,
        }
    }

    const falafelIcon = await map.loadImage(
        `./favicon-frames/a32-${Math.floor(Math.random() * 6) + 1}.png`,
    );
    map.addImage("falafel-icon", falafelIcon.data);
    const wrapIcon = await map.loadImage(`./wrap_32.png`);
    map.addImage("wrap-icon", wrapIcon.data);

    // const font = ["Noto Sans Italic"]//, "Kyroh", "sans-serif"];
    const font = ["Kyroh", "sans-serif"];

    map.addLayer({
        id: "falafel",
        type: "symbol",
        source: "falafel",
        filter: ["!", ["has", "point_count"]],
        layout: {
            "icon-image": "falafel-icon",
            "text-field": ["get", "shortName"],
            // "text-font": font,
            "text-offset": [0, 1.25],
            "text-anchor": "top",
            "icon-size": 0.8,
        },
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
            // "text-font": font,
            "text-offset": [-0.2, 0.9],
            "icon-size": 1.2,
        },
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
        map.easeTo({
            center: features[0].geometry.coordinates,
            zoom,
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