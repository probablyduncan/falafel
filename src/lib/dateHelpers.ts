export const getTimestamp = (dateString: string) => new Date(dateString).getTime();
export const MIGRATION_CUTOFF_TIME = getTimestamp("2026-03-06");