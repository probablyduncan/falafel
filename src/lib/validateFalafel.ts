import { getTimestamp, MIGRATION_CUTOFF_TIME } from "./dateHelpers";
import type { FalafelPlace } from "./falafelFetcher";

export function validateFalafel(entries: FalafelPlace[]) {

    const allErrors: {
        errors: string[];
        entry: FalafelPlace;
    }[] = [];
    
    for (const entry of entries) {
        
        const entryErrors: string[] = [];
        for (const validation of validations) {
            if (validation.fn(entry)) {
                entryErrors.push(validation.msg);
            }
        }

        if (entryErrors.length) {
            allErrors.push({ entry, errors: entryErrors });
        }
    }

    return allErrors;
}

const validations: {
    msg: string;
    fn: (e: FalafelPlace) => boolean;
}[] = [
    {
        msg: "dateEaten or dateEatenText must be set",
        fn: e => !e.dateEaten && !e.dateEatenText && (getTimestamp(e.dateSaved) < MIGRATION_CUTOFF_TIME),
    },
    {
        msg: "address missing",
        fn: e => !e.address,
    },
    {
        msg: "google maps link missing",
        fn: e => !e.googleMapsUri,
    },
]