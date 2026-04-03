import type {
	ScaffConfig,
	ScaffFile,
	ScaffFileGroup,
	ScaffModuleClass,
	ScaffModuleStore
} from "@types";

import { log } from "@/utils";
import { implHeaderRegex, arrowFnHeaderRegex } from "@/parser/regex";
import { convertClassMethods, parseFnParams } from "@/parser/export-module";


/**
 * Resolve optional (?) params in function expressions to ` = undefined`
 * @param str String to resolve
 * @returns Resolved string
 */
export function resolveOptionalParams(str: string) {
	// Regex to match function expressions: name = function(params)
	const funcExprRegex = /(\w+)\s*=\s*function\s*\(([^)]*)\)/g;

	return str.replace(funcExprRegex, (match, name, params) => {
		// Replace ? with = undefined in params
		const resolvedParams = params.replace(/\?/g, ' = undefined');
		return `${name} = function(${resolvedParams})`;
	});
}

/**
 * Convert arrow functions to function expressions
 * @param str String to convert
 * @returns Converted string
 */
export function convertArrowFn(str: string) {
	arrowFnHeaderRegex.lastIndex = 0;

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

			// Handle single-line comments
			if (!inString && char === '/' && str[i + 1] === '/') {
				// Skip until end of line
				while (i < str.length && str[i] !== '\n') i++;
				continue;
			}

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
		const classNames: string[] = [];

		for (const [_, m] of match.entries()) {
			const { name: className } = m;
			let { body } = m;

			body = resolveOptionalParams(body);
			body = convertClassMethods(body);
			body = convertArrowFn(body);

			if (!className || !body) continue;
			classNames.push(className);

			if (!module[filePath] || !module[filePath][className]) {
				let newFilePath: string | null = null;

				for (const file of fileGroup.scaff) {
					if (file.content.includes(`class ${className} {`)) {
						newFilePath = file.isIndex ? file.path : `${file.path}/${file.name}`;
						break;
					}
				}

				if (!newFilePath) {
					for (const file of fileGroup.generate) {
						if (file.content.includes(`class ${className} {`)) {
							newFilePath = file.isIndex ? file.path : `${file.path}/${file.name}`;
							break;
						}
					}
				}

				if (!newFilePath) {
					if (config.onNotFound === "error") {
						log.error(`Class \x1b[33m${className}\x1b[0m not found for file \x1b[34m${fileImpl.file.name}\x1b[0m. Aborting...`);
						return false;
					} else {
						log.warn(`Class \x1b[33m${className}\x1b[0m not found for file \x1b[34m${fileImpl.file.name}\x1b[0m. Skipping this class...`);
						continue;
					}
				}

				if (module[newFilePath]![className]!.type === "class") {
					const newMod = module[newFilePath]![className]! as ScaffModuleClass;
					newMod.body += `\n${body}`;

					// const classCloseBracket = module[newFilePath]![className]!.parsedStr.lastIndexOf("}");
					// module[newFilePath]![className]!.parsedStr = module[newFilePath]![className]!.parsedStr.slice(0, classCloseBracket) + `${body.replace('\n', "")}` + ((mIdx < match.length - 1) ? "\n\n" : "\n}\n");
				} else {
					if (config.onNotFound === "error") {
						log.error(`Class \x1b[33m${className}\x1b[0m not found for file \x1b[34m${fileImpl.file.name}\x1b[0m. Aborting...`);
						return false;
					} else {
						log.warn(`Class \x1b[33m${className}\x1b[0m not found for file \x1b[34m${fileImpl.file.name}\x1b[0m. Skipping this class...`);
						continue;
					}
				}

				// const classCloseBracket = module[newFilePath]![className]!.parsedStr.lastIndexOf("}");
				// module[newFilePath]![className]!.parsedStr = module[newFilePath]![className]!.parsedStr.slice(0, classCloseBracket) + `${body.replace('\n', "")}` + (mIdx < match.length - 1 ? "\n\n" : "\n}\n");

				// if (mIdx === match.length - 1) {
				// 	for (const name of classNames) {
				// 		if (!module[filePath] || !module[filePath]![name])
				// 			continue;

				// 		module[filePath]![name]!.parsedStr += "}\n";
				// 	}
				// } else
				// 	classNames.splice(classNames.indexOf(className), 1);
				continue;
			}
			else if (module[filePath]![className]!.type === "class") {
				module[filePath]![className]!.body += `\n${body}`;
				// const classCloseBracket = module[filePath]![className]!.parsedStr.lastIndexOf("}");
				// module[filePath]![className]!.parsedStr = module[filePath]![className]!.parsedStr.slice(0, classCloseBracket) + `${body.replace('\n', "")}` + ((mIdx < match.length - 1) ? "\n\n" : "\n}\n");
			} else {
				if (config.onNotFound === "error") {
					log.error(`Class \x1b[33m${className}\x1b[0m not found for file \x1b[34m${fileImpl.file.name}\x1b[0m. Aborting...`);
					return false;
				} else {
					log.warn(`Class \x1b[33m${className}\x1b[0m not found for file \x1b[34m${fileImpl.file.name}\x1b[0m. Skipping this class...`);
					continue;
				}
			}
		}
	}

	return true;
}
