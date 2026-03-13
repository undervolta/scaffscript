import type {
	GMProject,
	GMEvent
} from "@types";


function stripTrailingCommas(input: string): string {
	const result: string[] = [];
	let i = 0;

	while (i < input.length) {
		const ch = input[i];

		// Pass through strings verbatim (handles escaped quotes too)
		if (ch === '"') {
			result.push(ch);
			i++;

			while (i < input.length) {
				const sc = input[i];

				result.push(sc!);
				
				if (sc === '\\') {
					// escaped char — consume next char as-is
					i++;
					if (i < input.length) {
						result.push(input[i]!);

						i++;
					}
				} else if (sc === '"') {
					i++;
					break;
				} else {
					i++;
				}
			}

			continue;
		}

		// If it's a comma, peek ahead (skip whitespace) to check if next
		// non-whitespace char is a closing bracket/brace — if so, drop it
		if (ch === ',') {
			let j = i + 1;

			while (j < input.length && /\s/.test(input[j]!)) j++;

			if (j < input.length && (input[j] === '}' || input[j] === ']')) {
				// trailing comma — skip it
				i++;
				continue;
			}
		}

		result.push(ch!);
		i++;
	}

	return result.join('');
}

function createYYScript(name: string, dir: string) {
	return {
		
	};
}

/**
 * Parse the given string as JSON, stripping trailing commas first
 * @param raw String to parse
 * @returns Parsed JSON
 */
export function parseGMJson<T = unknown>(raw: string): T {
	const validJson = stripTrailingCommas(raw);
	return JSON.parse(validJson) as T;
}

export async function createGMResource(project: GMProject, path: string, content: string, event: GMEvent | null) {
	
}
