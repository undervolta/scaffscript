import type {
	ScaffConfig,
	ScaffFile,
	ScaffFileGroup,
	ScaffModuleStore
} from "@types";

import { log } from "@/utils";
import { implHeaderRegex, arrowFnHeaderRegex } from "@/parser/regex";
import { convertClassMethods, parseFnParams } from "@/parser/export-module";


/**
 * Convert arrow functions to function expressions
 * @param str String to convert
 * @returns Converted string
 */
export function convertArrowFn(str: string) {
	return str.replace(arrowFnHeaderRegex, (match: string, _p1: string, _p2: string, _offset: number, _input: string, groups?: {name: string; params: string}) => {
		if (!groups?.name) return match;
	
		const rawParams = groups.params?.trim() ?? "";
		const paramsSource = rawParams.startsWith("(") ? rawParams : `(${rawParams})`;
		const params = parseFnParams(paramsSource);
		
		return `${groups.name} = function(${params.combined.join(", ")})`;
	});
}

/**
 * Parse the given string for implementation headers
 * @param str String to parse
 * @returns Array of implementation headers
 */
export function parseHeader(str: string, regex: RegExp = implHeaderRegex) {
	const results = [];
	let match;

	while ((match = regex.exec(str)) !== null) {
		const name = match.groups!.name;

		const start = regex.lastIndex;
		let braceCount = 1;
		let inString = false;
		let stringChar = '';
		let i = start;

		for (; i < str.length; i++) {
			const char = str[i]!;

			if (inString) {
				if (char === stringChar && (i === 0 || str[i - 1] !== '\\')) {
					inString = false;
				}
			} else {
				if (char === '"' || char === "'") {
					inString = true;
					stringChar = char;
				} else if (char === '{') {
					braceCount++;
				} else if (char === '}') {
					braceCount--;

					if (braceCount === 0) break;
				}
			}
		}

		const body = str.slice(start, i);

		results.push({ name, body });

		regex.lastIndex = i + 1;
	}

	return results;
}

/**
 * Implement the classes in the given files
 * @param module Object with all exported modules
 * @param files Object with `scaff` and `generate` properties, each containing an array of files
 */
export function implementClass(module: ScaffModuleStore, fileGroup: ScaffFileGroup, config: ScaffConfig) {
	if (fileGroup.generate.length == 0 && fileGroup.scaff.length == 0) {
		log.warn("No files to implement classes from.");
		return false;
	}

	const toImpl: { parent: ScaffFile; file: ScaffFile }[] = [];

	for (const file of fileGroup.scaff) {
		if (file.childs.length > 0)
			file.childs.forEach(child => toImpl.push({ parent: file, file: child }));
	}

	for (const file of fileGroup.generate) {
		if (file.childs.length > 0)
			file.childs.forEach(child => toImpl.push({ parent: file, file: child }));
	}

	/*if (toImpl.length == 0) {
		log.warn("No files to implement classes from.");
		return false;
	}*/

	for (const fileImpl of toImpl) {
		const filePath = fileImpl.parent.isIndex ? fileImpl.parent.path : `${fileImpl.parent.path}/${fileImpl.parent.name}`;
		const match = parseHeader(fileImpl.file.content);
		
		for (const m of match) {
			const { name: className } = m;
			let { body } = m;

			body = convertClassMethods(body);
			body = convertArrowFn(body);

			if (!className || !body) continue;

			module[filePath]![className]!.parsedStr = module[filePath]![className]!.parsedStr.slice(0, -1) + `${body.replace('\n', "")}\n}\n`;
		}
	}

	return true;
}
