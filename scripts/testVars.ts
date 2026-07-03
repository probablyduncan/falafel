import { Client } from "@atproto/lex";
import { PasswordSession } from "@atproto/lex-password-session";
import * as site from "../src/lexicons/site.ts";
import fs from "fs";
import path from "path";

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
    if (Math.random() > 0.5) {
        console.log("updating file!!");
        fs.writeFileSync(path.join(process.cwd(), "pub.txt"), "pub name: " + pub.value.name + "\nupdated at: " + new Date().toISOString(), { encoding: "utf-8" });
    }
    else {
        console.log("not updating file!!");
    }

}

run();

