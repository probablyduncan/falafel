import { PlacesClient } from "@googlemaps/places";
import fs from "fs";
import path from "path";
import { getDateEatenText, getTimestamp } from "./dateHelpers";
import { getAtprotoClient, getDuncanContributor, getPublicationUri, rkeyFromUri } from "./atprotoHelpers";
import * as site from "../lexicons/site.ts";
import type { DatetimeString } from '@atproto/lex';
import truncateText from "./truncateText.ts";

export type FalafelStore = {
    /** list title */
    title: string;
    /** list description */
    description: string;
    /** list icon */
    icon: string;
    /** link to list in google maps */
    googleMapsUri: string;
    /** number of entries */
    length: number;
    /** entries, keyed by `FalafelPlace.cacheKey` */
    entries: Record<string, FalafelPlace>;
};

export type FalafelPlace = {
    /** unique, unchanging string, probably derived from `dateSaved` */
    cacheKey: string;
    /** atproto record identifier (rkey) */
    atprotoKey: string | null;
    /** name of falafel restaurant, as saved on list */
    name: string;
    /** written notes from list */
    review: string;
    /** place latitude from list */
    lat: number;
    /** place longitude from list */
    lng: number;
    /** google maps placeId of falafel restaurant */
    placeId: string | null;
    /** date review was last modified on list */
    dateUpdated: string;
    /** date added to list */
    dateSaved: string;
    /** optional, if set will be used instead of `dateAdded` */
    dateEaten: string | null;
    /** optional, will be displayed instead of `dateEaten` */
    dateEatenText: string | null;
    /** address returned by places api */
    address: string | null;
    /** link to place in google maps */
    googleMapsUri: string | null;
};

const FALAFEL_STORE_PATH = path.join(process.cwd(), "src/data/falafel_list.json");

export default async function fetchFalafel() {

    console.log("fetching falafel!");

    const response = await fetch("https://www.google.com/maps/preview/entitylist/getlist?pb=" + process.env.GOOGLE_MAPS_LIST_PB);
    if (!response.ok) {
        console.error(`Failed to fetch google maps saved places: ${response.status} ${response.statusText}`);
        return;
    }

    const fetchedMapJson = JSON.parse((await response.text()).replace(/^\)\]\}'/, "").trim()) as GetEntriesResponseSchema;
    const fetchedMapList = parseResponse(fetchedMapJson);
    console.log(`fetched ${fetchedMapList.entries.length} from google maps`);

    const store: FalafelStore = fs.existsSync(FALAFEL_STORE_PATH) ? JSON.parse(fs.readFileSync(FALAFEL_STORE_PATH, "utf-8")) as FalafelStore : {
        title: fetchedMapList.title,
        description: fetchedMapList.description,
        icon: fetchedMapList.icon,
        googleMapsUri: fetchedMapList.uri,
        length: 0,
        entries: {},
    };

    const unmatchedEntryKeys = new Set(Object.keys(store.entries));

    const placesClient = new PlacesClient({
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
    });

    const atprotoClient = await getAtprotoClient();

    for (const fetchedListEntry of fetchedMapList.entries) {

        // no review, don't include
        if (!fetchedListEntry.notes?.trim()) {
            continue;
        }

        let entryToSave: FalafelPlace;
        
        // already set, just update
        if (unmatchedEntryKeys.delete(fetchedListEntry.cacheKey)) {
            entryToSave = store.entries[fetchedListEntry.cacheKey];

            if (getTimestamp(entryToSave.dateUpdated) !== fetchedListEntry.dateModified.getTime()) {
                console.log(`\nupdated: ${fetchedListEntry.name}`);
            }

            entryToSave.name = fetchedListEntry.name;
            entryToSave.review = fetchedListEntry.notes;
            entryToSave.lat = fetchedListEntry.lat;
            entryToSave.lng = fetchedListEntry.lng;
            entryToSave.dateUpdated = fetchedListEntry.dateModified.toISOString();
            entryToSave.cacheKey = fetchedListEntry.cacheKey;
        }
        // create new entry
        else {
            entryToSave = store.entries[fetchedListEntry.cacheKey] ??= {
                cacheKey: fetchedListEntry.cacheKey,
                atprotoKey: null,
                name: fetchedListEntry.name,
                review: fetchedListEntry.notes,
                lat: fetchedListEntry.lat,
                lng: fetchedListEntry.lng,
                placeId: null,
                dateUpdated: fetchedListEntry.dateModified.toISOString(),
                dateSaved: fetchedListEntry.dateAdded.toISOString(),
                dateEaten: null,
                dateEatenText: null,
                address: null,
                googleMapsUri: null,
            };
        }

        // if not already done, query for url/address/etc
        if (!entryToSave.googleMapsUri) {
            try {
                const textSearchResult = await placesClient.searchText({
                    textQuery: fetchedListEntry.searchString,
                    locationBias: {
                        circle: {
                            center: {
                                latitude: fetchedListEntry.lat,
                                longitude: fetchedListEntry.lng,
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

                // sort by distance from the saved place, so the closest match is first
                const sortedSearchResults = textSearchResult[0].places?.map(p => ({
                    ...p,
                    distance: distance(p.location?.latitude ?? 1000, p.location?.longitude ?? 1000, fetchedListEntry.lat, fetchedListEntry.lng)
                })).filter(p => p.distance < 0.001).sort((a, b) => a.distance - b.distance) ?? [];

                const searchMatch = sortedSearchResults[0];
                if (!searchMatch) {
                    throw `\n !!! no matches found for search: ${fetchedListEntry.searchString}`;
                }

                const nameMatches = searchMatch.displayName?.text?.toLocaleLowerCase() === fetchedListEntry.name.toLocaleLowerCase();

                if (!nameMatches) {
                    console.warn(`\n !!! the name saved on the list "${fetchedListEntry.name}" does not match the search result '${searchMatch.displayName?.text}"\n     using 1st match: ${searchMatch.googleMapsUri}, distance: ${searchMatch.distance}`);

                    if (sortedSearchResults.length > 1) {
                        console.warn(`\n  other matches:`);
                        console.warn(sortedSearchResults.slice(1).map((p, i) => `      ${i + 2}. ${p.displayName?.text} (distance: ${p.distance}) (${p.googleMapsUri})`).join("\n"));
                    }
                }

                entryToSave.googleMapsUri = searchMatch.googleMapsUri ?? "";
                entryToSave.address = searchMatch.shortFormattedAddress ?? "";
                entryToSave.placeId = searchMatch.name ?? "";
            }
            catch (err) {
                console.error(err);
            }
        }

        // atproto doc fields to update whether or not record already exists
        const atprotoDocumentUpdateObject = {
            title: entryToSave.name,
            textContent: entryToSave.review,
            description: "A falafel wrap review, which begins as follows:  " + truncateText(entryToSave.review, 30),
            updatedAt: entryToSave.dateUpdated as DatetimeString,
            lat: entryToSave.lat.toFixed(4),
            lng: entryToSave.lng.toFixed(4),
            googleMapsUri: entryToSave.googleMapsUri,
            dateEaten: getDateEatenText(entryToSave),
        }

        // try fetch existing atproto doc
        let existingAtprotoDocument: site.standard.document.Main | null = null;
        if (entryToSave.atprotoKey) {
            try {
                const getResult = await atprotoClient.get(site.standard.document, {
                    rkey: entryToSave.atprotoKey,
                });

                existingAtprotoDocument = getResult.value;
            }
            catch { }
        }

        // if atproto doc exists, update it
        if (existingAtprotoDocument) {
            await atprotoClient.put(site.standard.document, {
                ...existingAtprotoDocument,
                ...atprotoDocumentUpdateObject,
            }, {
                rkey: entryToSave.atprotoKey!,
            });
        }
        // otherwise, create it
        else {
            const saveResult = await atprotoClient.create(site.standard.document, {
                site: getPublicationUri(),
                path: `/wraps/${entryToSave.cacheKey}`,
                contributors: [getDuncanContributor()],
                publishedAt: entryToSave.dateSaved as DatetimeString,
                tags: ["falafel", "review", "food-review", "falafel-review"],
                ...atprotoDocumentUpdateObject,
            });

            entryToSave.atprotoKey = rkeyFromUri(saveResult.uri);
        }

        // flag missing fields
        const missingFields = (["address", "googleMapsUri", "atprotoKey", "lat", "lng"] as (keyof FalafelPlace)[]).filter(field => !entryToSave[field]);
        if (missingFields.length) {
            console.warn(`\n !!! ${entryToSave.name} is missing the following fields: "${missingFields.join(`", "`)}"`);
        }
    }

    // clear out expired places from json store
    for (const unmatchedKey of [...unmatchedEntryKeys]) {

        const unmatchedEntry = store.entries[unmatchedKey];
        if (!unmatchedEntry) {
            continue;
        }

        if (unmatchedEntry.atprotoKey) {
            try {
                await atprotoClient.delete(site.standard.document, { rkey: unmatchedEntry.atprotoKey });
            }
            catch {}
        }

        delete store.entries[unmatchedKey];
    }

    // save to json
    store.length = Object.keys(store.entries).length;
    fs.writeFileSync(FALAFEL_STORE_PATH, JSON.stringify(store, null, 2));

    console.info(`updated ${fetchedMapList.title} (${fetchedMapList.length} entries, ${store.length} with reviews)`);
}

const distance = (x1: number, y1: number, x2: number, y2: number) =>
    Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

const parseResponse = (data: GetEntriesResponseSchema) => ({
    title: data[0][4],
    description: data[0][5],
    icon: data[0][17],
    uri: data[0][2][2],
    length: data[0][12],
    entries: data[0][8].map(parseEntry),
});

const parseEntry = (entry: GetEntriesEntrySchema) => ({
    cacheKey: entry[9][0].toString(),
    name: entry[2],
    notes: entry[3],
    lat: entry[1][5][2],
    lng: entry[1][5][3],
    searchString: entry[1][2] ? entry[1][2] : entry[2],
    dateAdded: unixTimestampToDate(entry[9][0]),
    dateModified: unixTimestampToDate(entry[10][0]),
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





// nosh
// "address": "33 Minories, London EC3N 1DE","googleMapsUri": "https://maps.app.goo.gl/oAF7KdawMTQw1jjY8"

// cafe falafel
// "address": "Marrakesh 40000, Morocco","googleMapsUri": "https://maps.app.goo.gl/Ae5Kd6sMJfMfSxmF6"