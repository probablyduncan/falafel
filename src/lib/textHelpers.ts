export function truncateText(fullText: string, maxLength: number) {

    const trimmedText = fullText.trim();

    // smaller than target, just return
    if (trimmedText.length <= maxLength) {
        return trimmedText;
    }

    return trimmedText.substring(0, maxLength).trimEnd().replace(/[^(a-zA-Z0-9)]*[a-zA-Z0-9]*$/, "...");
}

export function countWords(text: string) {
    return text?.trim().split("\n").flatMap(p => p.split("—")).flatMap(p => p.split("-")).flatMap(p => p.split(" ")).filter(Boolean).length ?? 0;
}

export function getOrdinal(number: number) {

    const last = number % 10;
    const lastTwo = number % 100;
    
    if (last === 1 && lastTwo !== 11) {
        return "st";
    }

    if (last === 2 && lastTwo !== 12) {
        return "nd";
    }

    if (last === 3 && lastTwo !== 13) {
        return "rd";
    }

    return "th";
}