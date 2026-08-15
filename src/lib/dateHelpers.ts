import type { FalafelPlace } from "./falafelFetcher";

export const getTimestamp = (dateString: string) => new Date(dateString).getTime();
export const MIGRATION_CUTOFF_TIME = getTimestamp("2026-03-06");

export function getDateEatenText(p: Pick<FalafelPlace, "dateEatenText" | "dateEaten" | "dateSaved">, fallback: string = "[unknown]"): string {
    if (p.dateEatenText) {
        return p.dateEatenText;
    }

    const dateEaten = new Date(p.dateEaten ?? "");
    if (dateEaten?.getTime()) {
        return toShortDateString(dateEaten);
    }

    const dateSaved = new Date(p.dateSaved);
    if (dateSaved.getTime() > MIGRATION_CUTOFF_TIME) {
        return toShortDateString(dateSaved);
    }
    
    return fallback;
}

/**
 * "September 26, 2026"
 */
export function toLongDateString(date: Date | undefined): string {
    if (!date) {
        return "";
    }
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        day: "2-digit",
        month: "long",
    }).format(date);
}

/**
 * "Sep 26, 2026"
 */
export function toShortDateString(date: Date | undefined): string {
    if (!date) {
        return "";
    }
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        day: "2-digit",
        month: "short",
    }).format(date);
}
