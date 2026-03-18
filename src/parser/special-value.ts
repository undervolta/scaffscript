import pkg from "../../package.json" with { type: "json" };
import { 
	commentRegex,
	specialValueRegex,
	countSubstring
} from "@/parser/regex";

import type { ScaffFile } from "@types";


/**
 * Parse special values in the given file
 * @param file File to parse
 * @param counter Counter object
 * @returns Parsed file content and new counter value
 */
export function parseSpecialValues(file: ScaffFile, counter: { count: number }) {
	let res = file.content;

	// remove comments first
	const matchComment = [...res.matchAll(commentRegex)];
	for (const match of matchComment) {
		res = res.replace(match[0]!, "");
	}

	// then replace special values
	const matchSpecial = [...res.matchAll(specialValueRegex)];
	for (const match of matchSpecial) {
		const { cmd } = match.groups!;

		switch (cmd) {
			case "now":
				res = res.replace(match[0]!, new Date().toISOString());
				break;

			case "today":
				res = res.replace(match[0]!, new Date().toISOString().split("T")[0]!);
				break;

			case "version":
				res = res.replace(match[0]!, pkg.version);
				break;

			case "file":
				res = res.replace(match[0]!, file.name);
				break;

			case "line":
				res = res.replace(match[0]!, String(countSubstring(res.slice(0, match.index), '\n') + 1));
				break;
			
			case "counter":
				res = res.replace(match[0]!, String(counter.count));
				counter.count++;
				break;
		}
	}

	return { 
		content: res,
		counter: counter.count
	};
}
