export default function truncateText(fullText: string, maxLength: number) {

    const trimmedText = fullText.trim();

    // smaller than target, just return
    if (trimmedText.length <= maxLength) {
        return trimmedText;
    }

    return trimmedText.substring(0, maxLength).trimEnd().replace(/[^(a-zA-Z0-9)]*[a-zA-Z0-9]*$/, "...");
}