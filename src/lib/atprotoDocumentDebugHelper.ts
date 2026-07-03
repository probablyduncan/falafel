import { getAtprotoClient, getPublicationUri } from "./atprotoHelpers.ts";
import * as site from "../lexicons/site.ts";
import type { ListRecordItem } from '@atproto/lex';
import readline from "readline/promises";
import { MIGRATION_CUTOFF_TIME } from "./dateHelpers.ts";

export async function deleteDocuments(options?: {
    /**
     * If true, document will be deleted.
     * If unset, all documents will be deleted.
     */
    filter?: (document: ListRecordItem<site.standard.document.Main>) => boolean;
    /**
     * If set, will be called before deletion with a list of all records that are about to be deleted.
     * If it returns false, deletion will be cancelled.
     */
    confirm?: (documentsBeingDeleted: ListRecordItem<site.standard.document.Main>[]) => Promise<boolean>;
}) {

    const client = await getAtprotoClient();
    let documents: ListRecordItem<site.standard.document.Main>[] = [];
    let getCursor: string | undefined = undefined;
    let i = 0;
    do {
        const { records, cursor }: {
            records: ListRecordItem<site.standard.document.Main>[];
            cursor?: string | undefined;
        } = await client.list(site.standard.document, { limit: 100, cursor: getCursor });

        documents.push(...records);
        getCursor = cursor;

    } while (getCursor && (++i < 100));

    const toDelete: ListRecordItem<site.standard.document.Main>[] = [];

    for (const document of documents) {
        if (document.value.site !== getPublicationUri()) {
            continue;
        }

        if (options?.filter && !options.filter(document)) {
            continue;
        }

        toDelete.push(document);
    }

    if (options?.confirm && !await options.confirm(toDelete)) {
        return;
    }

    async function deleteDocument(document: ListRecordItem<site.standard.document.Main>) {
        try {
            await client.delete(site.standard.document, { rkey: document.uri.split("/").at(-1) ?? "" });
            console.log("deleted ", document.value.title);
        }
        catch {
            console.error("failed to delete ", document.value.title);
        }
    }

    await Promise.all(toDelete.map(deleteDocument));
}

await deleteDocuments({
    confirm: async (documents) => {
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        console.log("  will delete:", documents.map(d => d.value.title).join(", "), "\n");

        const answer = await rl.question(`delete ${documents.length} records? (y/n) `);
        rl.close();

        const shouldDelete = answer?.toLowerCase().includes("y");
        console.log(shouldDelete ? "deleting!" : "cancelling!");

        return shouldDelete;
    },
    filter: (document) => {
        return new Date(document.value.publishedAt as string ?? "").getTime() > MIGRATION_CUTOFF_TIME
    },
});