import { getTimestamp, MIGRATION_CUTOFF_TIME } from "./dateHelpers";
import type { FalafelPlace } from "./falafelFetcher";

export type FalafelPlaceSortDto = Pick<FalafelPlace, "dateSaved" | "dateEaten">;

/**
 * Returns an array of entries by resolved eatenDate descending.
 */
export default function sortFalafel<T extends FalafelPlaceSortDto>(entries: T[]): T[] {

    const preMigrationBucket: T[] = [];
    const postMigrationBucket: T[] = [];
    const postMigrationBackdatedBucket: T[] = [];

    for (const entry of entries) {

        // saved pre-migration, therefore also eaten pre-migration
        if (new Date(entry.dateSaved).getTime() < MIGRATION_CUTOFF_TIME) {
            preMigrationBucket.push(entry);
            continue;
        }

        // saved post-migration, but backdated, eaten pre-migration
        if (entry.dateEaten && new Date(entry.dateEaten).getTime() < MIGRATION_CUTOFF_TIME) {
            postMigrationBackdatedBucket.push(entry);
            continue;
        }

        // saved and eaten post-migration
        postMigrationBucket.push(entry);
    }

    // sort pre-migration by save date
    preMigrationBucket.sort((a, b) => getTimestamp(b.dateSaved) - getTimestamp(a.dateSaved));

    // sort post-migration by (eat date ?? save date)
    postMigrationBucket.sort((a, b) => getTimestamp(b.dateEaten ?? b.dateSaved) - getTimestamp(a.dateEaten ?? a.dateSaved));

    // insert backdated into already-sorted pre-migration:
    for (const entry of postMigrationBackdatedBucket) {
        // find the oldest dated pre-migration place that our backdated entry is before, and insert it right afterwords
        const insertIndex = preMigrationBucket.findLastIndex(p => p.dateEaten && getTimestamp(entry.dateEaten!) < getTimestamp(p.dateEaten)) + 1;
        preMigrationBucket.splice(insertIndex, 0, entry);
    }

    return postMigrationBucket.concat(preMigrationBucket);
}