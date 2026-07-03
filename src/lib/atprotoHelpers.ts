import { Client, type DidString, type UriString } from "@atproto/lex";
import { PasswordSession } from "@atproto/lex-password-session";
import * as site from "../lexicons/site.ts";

let _client: Client | null = null;
export async function getAtprotoClient() {

    if (!_client) {
        try {
            const session = await PasswordSession.login({
                service: process.env.ATPROTO_SERVICE ?? "",
                identifier: process.env.PUBLIC_ATPROTO_DID ?? "",
                password: process.env.ATPROTO_APP_PASSWORD ?? "",
            });

            _client = new Client(session);

            if (!_client || !session || !session.handle || !session.did) {
                throw "session failed to resolve";
            }
        }
        catch (err) {
            throw "bsky authentication failed: " + err;
        }
    }

    return _client;
}

export function rkeyFromUri(uri: UriString) {
    return uri?.split("/")?.at(-1) ?? "";
}

export function getPublicationUri(): UriString {
    return `at://${process.env.PUBLIC_ATPROTO_DID}/site.standard.publication/${process.env.PUBLIC_ATPROTO_PUBLICATION_RKEY}`;
}

let _duncanContributor: site.standard.document.Contributor;
export function getDuncanContributor(): site.standard.document.Contributor {
    return _duncanContributor ??= site.standard.document.contributor.$build({
        did: process.env.PUBLIC_ATPROTO_DID as DidString,
        displayName: "duncan",
        role: "author/eater",
    });
}