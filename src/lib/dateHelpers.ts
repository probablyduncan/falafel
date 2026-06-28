import type { FalafelPlace } from "./falafelFetcher";

export const getTimestamp = (dateString: string) => new Date(dateString).getTime();
export const MIGRATION_CUTOFF_TIME = getTimestamp("2026-03-06");

export function getDateEatenText(p: Pick<FalafelPlace, "dateEatenText" | "dateEaten" | "dateSaved">) {
    if (p.dateEatenText) {
        return p.dateEatenText;
    }

    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        day: "2-digit",
        month: "short",
    }).format(new Date(p.dateEaten ? p.dateEaten : p.dateSaved));
}