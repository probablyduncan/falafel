import { PlacesClient } from "@googlemaps/places";
import { z } from "astro/zod";
import fs from "fs";
import path from "path";

export const falafelPlaceSchema = z.object({
    name: z.string().describe("Place name"),
    address: z.string().describe("Short formatted place address"),
    review: z.string().describe("Notes from saved list"),
    lat: z.number().describe("Latitude"),
    lng: z.number().describe("Longitude"),
    dateAdded: z.date().describe("Date saved to list"),
    dateModified: z.date().describe("Date review was last edited"),
    uri: z.string().url().describe("URL to place in Google Maps"),
    placeId: z.string().describe("Google Maps place identifier"),
});

export type FalafelPlace = z.infer<typeof falafelPlaceSchema>;
export type FalafelStore = Record<string, FalafelPlace>;

const FALAFEL_DATA_DIR = path.join(process.cwd(), "src/data");
const FALAFEL_ENTRIES_PATH = path.join(FALAFEL_DATA_DIR, "falafel_list_entries.json");
const FALAFEL_METADATA_PATH = path.join(FALAFEL_DATA_DIR, "falafel_list_metadata.json");

export default async function fetchFalafel() {

    const response = await fetch("https://www.google.com/maps/preview/entitylist/getlist?pb=!1m4!1s44mcllfeROZvxnmw4BonXg!2e1!3m1!1e1!2e2!3e2!4i500!6m3!1sQviWabnRMYGnhbIPoN7ygAM!15i204459!28e2!16b1");
    if (!response.ok) {
        console.error(`Failed to fetch google maps saved places: ${response.status} ${response.statusText}`);
        return;
    }

    const placesClient = new PlacesClient({
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
    });

    const raw = await response.text();
    const json = JSON.parse(raw.replace(/^\)\]\}'/, "").trim()) as GetEntriesResponseSchema;
    const list = parseResponse(json);
    console.info(`fetched list: ${list.title} (${list.length} entries) from ${list.uri}`);

    fs.writeFileSync(FALAFEL_METADATA_PATH, JSON.stringify({
        title: list.title,
        description: list.description,
        icon: list.icon,
        uri: list.uri,
    }, null, 2));

    const store: FalafelStore = fs.existsSync(FALAFEL_ENTRIES_PATH) ? JSON.parse(fs.readFileSync(FALAFEL_ENTRIES_PATH, "utf-8")) as FalafelStore : {};
    const existingKeys = new Set<string>(Object.keys(store));

    for (const entry of list.entries) {

        // if already fetched, will update data from list but won't refetch uri/address/etc
        if (existingKeys.delete(entry.cacheKey)) {
            console.info(`${entry.name} (${store[entry.cacheKey].address}) found in json, no need to fetch`)
            store[entry.cacheKey].dateModified = entry.dateModified;
            store[entry.cacheKey].name = entry.name;
            store[entry.cacheKey].review = entry.notes;
            continue;
        }
        
        const textSearchResult = await placesClient.searchText({
            textQuery: entry.searchString,
            locationBias: {
                circle: {
                    center: {
                        latitude: entry.lat,
                        longitude: entry.lng,
                    },
                }
            },
            regionCode: "GB",
        }, {
            maxResults: 5,
            otherArgs: {
                headers: {
                    'X-Goog-FieldMask': "places.name,places.location,places.displayName,places.googleMapsUri,places.shortFormattedAddress,places.businessStatus",
                },
            },
        });

        const sortedMatches = textSearchResult[0].places?.sort((a, b) => {
            // sort by distance from the saved place, so the closest match is first
            const aDistance = distance([a.location?.latitude ?? 0, a.location?.longitude ?? 0], [entry.lat, entry.lng]);
            const bDistance = distance([b.location?.latitude ?? 0, b.location?.longitude ?? 0], [entry.lat, entry.lng]);
            return aDistance - bDistance;
        }) ?? [];

        const match = sortedMatches[0];
        if (!match) {
            console.error(`! no matches found for place: ${entry.searchString}`);
            continue;
        }

        if (sortedMatches.length > 1) {
            console.warn(`- ${sortedMatches.length} matches found for place: ${entry.searchString}. Using closest match: ${match.displayName?.text} (${match.googleMapsUri})`);
            console.warn(`  other matches: ${sortedMatches.slice(1).map(m => `${m.displayName?.text} (${m.googleMapsUri})`).join(", ")}`);
        }

        store[entry.cacheKey] = {
            name: entry.name,
            review: entry.notes,

            lat: entry.lat,
            lng: entry.lng,

            dateAdded: entry.dateAdded,
            dateModified: entry.dateModified,

            placeId: match.name ?? "",
            uri: match.googleMapsUri ?? "",
            address: match.shortFormattedAddress ?? "",
        };

        console.info(`successfully fetched ${entry.name} (${match.shortFormattedAddress})`);
    }

    // remove any key from json no longer saved
    // these keys will be the ones not found in entries
    existingKeys.forEach(staleKey => {
        console.warn(`   deleting stale ${staleKey}`);
        delete store[staleKey];
    });

    fs.writeFileSync(FALAFEL_ENTRIES_PATH, JSON.stringify(store, null, 2));
}

function distance(c1: [number, number], c2: [number, number]) {
    return Math.sqrt(Math.pow(c1[0] - c2[0], 2) + Math.pow(c1[1] - c2[1], 2));
}






const parseResponse = (data: GetEntriesResponseSchema) => ({
    title: data[0][4],
    description: data[0][5],
    icon: data[0][17],
    uri: data[0][2][2],
    length: data[0][12],
    entries: data[0][8].map(parseEntry),
});

const parseEntry = (entry: GetEntriesEntrySchema) => ({
    lat: entry[1][5][2],
    lng: entry[1][5][3],
    name: entry[2],
    notes: entry[3],
    searchString: entry[1][2] ? entry[1][2] : entry[2],
    cacheKey: entry[9][0].toString(),
    dateAdded: unixTimestampToDate(entry[9][0]),
    dateModified: unixTimestampToDate(entry[10][0]),
    // kgmid: entry[1][7],
    // nameFormattedAddress: entry[1][2],
    // formattedAddress: entry[1][4],
});

const unixTimestampToDate = (seconds: number) => new Date(seconds * 1000);

type GetEntriesEntrySchema = [
    unknown,
    [
        unknown,
        unknown,
        string | undefined, // seems to be name + formatted address? but not always
        unknown,
        string | undefined, // seems to be formatted address?
        [
            unknown, unknown,
            number, number, // lat/long with decimal, for example [51.3892935, 1.380819]
        ],
        [
            string, string // unsure, for example "5177261457814502961", "-8878226244713078437"
        ],
        string?, // kgmid - occasionally set knowledge graph id, for example /g/123123123. search with: https://www.google.com/search?kgmid=/g/123123123
    ],
    string, // place name
    string, // place notes
    unknown,
    unknown,
    unknown,
    unknown[],
    unknown[],
    [number, number], // date added
    [number, number], // date modified
    unknown,
    unknown[],
    unknown,
    unknown,
    unknown[],
]

type GetEntriesResponseSchema =
    [
        [
            [
                /** list id */
                string,
                // more stuff after, unsure
            ],
            unknown,
            [
                unknown, // number?
                unknown, // number?
                string, // link to view
                string, // link with token?
            ],
            unknown[],  // author information
            string, // list title
            string, // list description
            unknown,
            unknown,
            GetEntriesEntrySchema[],
            unknown[],
            [number, number], // date created
            [number, number], // date modified
            unknown,
            unknown,
            unknown,
            unknown,
            unknown,
            string, // map icon
            unknown,
            unknown,
            unknown,
        ],
        unknown,
        unknown,
        unknown,
        unknown,
        unknown,
        unknown, // report list link
    ]