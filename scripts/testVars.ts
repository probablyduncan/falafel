import { Client } from "@atproto/lex";
import { PasswordSession } from "@atproto/lex-password-session";
import * as site from "../src/lexicons/site.ts";

async function run() {

    const session = await PasswordSession.login({
        service: process.env.ATPROTO_SERVICE ?? "",
        identifier: process.env.PUBLIC_ATPROTO_DID ?? "",
        password: process.env.ATPROTO_APP_PASSWORD ?? "",
    });

    const client = new Client(session);

    const pub = await client.get(site.standard.publication, {
        rkey: process.env.PUBLIC_ATPROTO_PUBLICATION_RKEY ?? "",
    });

    console.log("pub name", pub.value.name);
}

run();

