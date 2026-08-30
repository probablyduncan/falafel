// this is taken from https://github.com/probablyduncan/prose-quotes-vsix/blob/main/src/quoteFormatter.ts

const STRAIGHT_DOUBLE = '"';
const STRAIGHT_SINGLE = "'";
const OPEN_DOUBLE = "\u201C";
const CLOSE_DOUBLE = "\u201D";
const OPEN_SINGLE = "\u2018";
const CLOSE_SINGLE = "\u2019";

function isOpeningContext(prev: string): boolean {
	if (prev === "") {
		return true;
	}
	if (/\s/.test(prev)) {
		return true;
	}
	if (prev === "(" || prev === "[" || prev === "{") {
		return true;
	}
	if (prev === OPEN_DOUBLE || prev === OPEN_SINGLE) {
		return true;
	}
	return false;
}

export function formatQuotes(input: string): string {
	let out = "";
	for (const ch of input) {
		const prev = out.length > 0 ? out[out.length - 1] : "";
		if (ch === STRAIGHT_DOUBLE) {
			out += isOpeningContext(prev) ? OPEN_DOUBLE : CLOSE_DOUBLE;
		} else if (ch === STRAIGHT_SINGLE) {
			out += isOpeningContext(prev) ? OPEN_SINGLE : CLOSE_SINGLE;
		} else {
			out += ch;
		}
	}
	return out;
}