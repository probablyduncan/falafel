import * as site from "../lexicons/site.ts";
import getFalafel from "./falafelLoader.ts";
import { getAtprotoClient } from "./atprotoHelpers.ts";

async function updatePublication() {
    try {
        const falafel = getFalafel();
        const client = await getAtprotoClient();

        const getResult = await client.get(site.standard.publication, {
            rkey: process.env.PUBLIC_ATPROTO_PUBLICATION_RKEY ?? "",
        });

        await client.put(site.standard.publication, {
            ...getResult.value,
            name: "FALAFEL•FYI",
            description: falafel.description,
            url: "https://falafel.fyi",
            basicTheme: {
                $type: "site.standard.theme.basic",
                foreground: {
                    $type: "site.standard.theme.color#rgb",
                    r: 36,
                    g: 32,
                    b: 29,
                },
                background: {
                    $type: "site.standard.theme.color#rgb",
                    r: 253,
                    g: 225,
                    b: 206,
                },
                accent: {
                    $type: "site.standard.theme.color#rgb",
                    r: 241,
                    g: 40,
                    b: 146,
                },
                accentForeground: {
                    $type: "site.standard.theme.color#rgb",
                    r: 253,
                    g: 225,
                    b: 206,
                },
            },
            preferences: {
                showInDiscover: true,
            },
        }, {
            rkey: process.env.PUBLIC_ATPROTO_PUBLICATION_RKEY ?? "",
        });
    }
    catch (err) {
        console.error("updatePublicationRecord error:", err);
    }
}