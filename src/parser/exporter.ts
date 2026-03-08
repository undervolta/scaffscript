import type { 
	VortexFileGroup, 
	VortexModule,
	VortexModuleInterface,
	VortexModuleType,
	VortexModuleRetry
} from "@types";

function inferType(value: string): "any" | "string" | "number" | "boolean" | "object" | "method" | "array" | "enum" {
	value = value.trim();
	if (value.startsWith('"') || value.startsWith("'")) return "string";
	if (/^\d/.test(value)) return "number";
	if (value === "true" || value === "false") return "boolean";
	if (value.startsWith("{") || value.includes("=>")) return "method";
	if (value.startsWith("[")) return "array";
	if (value.startsWith("{")) return "object";
	return "any";
}

function inferInlineType(value: string): "any" | "string" | "number" | "boolean" | "object" | "method" | "array" | "enum" {
	value = value.trim();

	if (value.toLowerCase() === "string") return "string";
	if (value.toLowerCase() === "number") return "number";
	if (value.toLowerCase() === "boolean") return "boolean";
	if (value.toLowerCase() === "object") return "object";
	if (value.toLowerCase() === "array") return "array";
	if (value.toLowerCase() === "enum") return "enum";
	return "any";
}

function getDefaultValue(type: "any" | "string" | "number" | "boolean" | "object" | "method" | "array" | "enum") {
	switch (type) {
		case "string": return '""';
		case "number": return "0";
		case "boolean": return "false";
		case "object": return "{}";
		case "array": return "[]";
		default: return null;
	}
}

function getObjectMembers(module: VortexModule, retryList: VortexModuleRetry[], filePath: string, name: string, objCode: string, isType: boolean = false) {
	const deleteCommentRegex = /\/\/[^\n]*|\/\*[\s\S]*?\*\//g;
	const cleanObjCode = objCode.replace(deleteCommentRegex, "").replace(/\s+/g, "");
	
	const shapes = isType ? cleanObjCode.split('=')[1]!.trim() : null;
	const members = cleanObjCode.split('{')[1]!.replace("}", "").split(',');
	const memberNames: string[] = [];
	const memberTypes: ("any" | "string" | "number" | "boolean" | "object" | "method" | "array" | "enum")[] = [];
	const memberValues: any[] = [];
	
	if (objCode.includes("extends")) {
		const extendsMatch = objCode.match(/extends (\w+)/);

		if (extendsMatch) {
			const extendsName = extendsMatch[1]!;

			if (!module[filePath])
				module[filePath] = {};
			
			if (!module[filePath][extendsName])
				retryList.push({ filePath, name, targetName: extendsName });
			else {
				const extendsInterface = module[filePath][extendsName] as VortexModuleInterface;
				
				extendsInterface.memberNames.forEach(m => memberNames.push(m));
				extendsInterface.memberTypes.forEach(t => memberTypes.push(t));
				extendsInterface.memberValues.forEach(v => memberValues.push(v));
			} 
		}
	} else if (isType && objCode.includes("&")) {
		const andSplit = shapes!.split("&").map(s => s.trim().replace(";", ""));

		for (const and of andSplit) {
			if (and.startsWith("{"))
				continue;

			if (!module[filePath])
				module[filePath] = {};

			if (!module[filePath][and])
				retryList.push({ filePath, name, targetName: and });
			else {
				const extendsType = module[filePath][and] as VortexModuleType;
				
				extendsType.memberNames.forEach(m => memberNames.push(m));
				extendsType.memberTypes.forEach(t => memberTypes.push(t));
				extendsType.memberValues.forEach(v => memberValues.push(v));
			}
		}
	}

	for (const member of members) {
		const parts = member.split(':').map(p => p.replace(";", ""));
		const defParts = parts.length === 1 ? parts[0]!.split('=') : parts[1]!.split('=');
		const partFirst = defParts[0]!.trim().replace(";", "");

		const memName = /\w+/.exec(parts[0]!.replace("?", ""))![0]!;
		const defValue = defParts.length === 1 
			? (parts[0]!.endsWith('?') ? 'undefined' : getDefaultValue(inferInlineType(partFirst)))
			: defParts[1]!.trim();

		if (!memberNames.includes(memName)) {
			memberNames.push(memName);
			memberTypes.push(parts.length === 1 ? "any" : inferInlineType(partFirst));
			memberValues.push(defValue);
		} else {
			const idx = memberNames.indexOf(memName);
			memberTypes[idx] = parts.length === 1 ? "any" : inferInlineType(partFirst);
			memberValues[idx] = defValue;
		}
	} 

	return {
		memberNames,
		memberTypes,
		memberValues
	};
}

function countBraces(line: string): number {
	let count = 0;
	let inString = false;
	let stringChar = '';

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (inString) {
			if (char === stringChar && (i === 0 || line[i - 1] !== '\\')) {
				inString = false;
			}
		} else {
			if (char === '"' || char === "'") {
				inString = true;
				stringChar = char;
			} else if (char === '{') {
				count++;
			} else if (char === '}') {
				count--;
			}
		}
	}

	return count;
}

function convertClassMethods(classBody: string): string {
	// Convert method syntax to function expressions
	// e.g., show_name() { ... } to show_name = function() { ... }
	const methodRegex = /(\w+)\s*\(([^)]*)\)\s*{([\s\S]*?)}/g;
	return classBody.replace(methodRegex, (match, methodName, params, body) => {
		// Avoid converting if it's part of a function expression like print = function() {
		if (methodName === 'function') return match;
		return `${methodName} = function(${params.replaceAll("?", " = undefined")}) {${body}}`;
	});
}

/**
 * Get all exported modules from the given files
 * @param files Object with `vortex` and `generate` properties, each containing an array of files
 * @returns Object with all exported modules
 */
export function getExportedModules(files: VortexFileGroup) {
	const module: VortexModule = {};

	if (files.generate.length == 0 && files.vortex.length == 0)
		return module;

	const retryList: VortexModuleRetry[] = []; 

	for (const file of files.vortex) {
		const filePath = file.isIndex ? file.path : `${file.path}/${file.name}`;
		const lines = file.content.split('\n');
		let i = 0;
		
		while (i < lines.length) {
			if (!lines[i]) {
				i++;
				continue;
			}

			const line = lines[i]!.trim();
			if (!line.startsWith('export ')) {
				i++;
				continue;
			}

			if (line.startsWith('export function ')) {
				// Collect multiline function
				const funcLines = [];
				let braceCount = 0;
				let j = i;

				for (; j < lines.length; j++) {
					const l = lines[j];

					funcLines.push(l);
					braceCount += countBraces(l!);

					if (braceCount <= 0 && (l?.trim().endsWith('}') || l?.trim().includes(';'))) break;
				}
				i = j + 1;

				const funcCode = funcLines.join('\n');
				const match = funcCode.match(/export function (\w+)/);
				
				if (match) {
					const name = match[1]!;

					if (!module[filePath]) 
						module[filePath] = {};

					const parsedStr = funcCode.replace("export ", "");

					module[filePath][name] = { name, value: parsedStr, type: 'function', parsedStr };
				}
			} else if (line.startsWith('export class ')) {
				// Collect multiline class
				const classLines = [];
				let braceCount = 0;
				let j = i;

				for (; j < lines.length; j++) {
					const l = lines[j];

					classLines.push(l);
					braceCount += countBraces(l!);
					
					if (braceCount <= 0 && (l?.trim().endsWith('}') || l?.trim().includes(';'))) break;
				}

				i = j + 1;

				const classCode = classLines.join('\n');
				const match = classCode.match(/export class (\w+)/);

				if (match) {
					const name = match[1]!;
					const constructor = classCode.match(/constructor\s*\(([^)]*)\)/)?.[1] ?? "()";

					if (!module[filePath]) 
						module[filePath] = {};

					// Extract class body
					const bodyMatch = classCode.match(/{([\s\S]*)}/);
					let classBody = bodyMatch ? bodyMatch[1] : '';
					
					// Remove constructor line
					if (classBody) {
						classBody = classBody.replace(/^\s*constructor\s*\([^)]*\)\s*\n?/m, '');
						classBody = convertClassMethods(classBody);
	
						if (classBody.includes("=>")) {
							const argsMatch = classBody.match(/\([^)]*\)\s*=>/)?.[0];
							
							if (argsMatch)
								classBody = classBody.replace(argsMatch, `function${argsMatch.replace("=>", "").replaceAll("?", " = undefined").trimEnd()}`);
						}
					}

					const parsedStr = `function ${name}(${constructor.replaceAll("?", " = undefined")}) constructor {\n${classBody}\n}`;

					module[filePath][name] = { name, value: classCode.replace("export ", ""), type: 'class', parsedStr };
				}
			} else if (line.startsWith('export interface ')) {
				// Collect multiline interface
				const interfaceLines = [];
				let braceCount = 0;
				let j = i;

				for (; j < lines.length; j++) {
					const l = lines[j];

					interfaceLines.push(l);
					braceCount += countBraces(l!);
					
					if (braceCount <= 0 && (l?.trim().endsWith('}') || l?.trim().includes(';'))) break;
				}

				i = j + 1;

				const interfaceCode = interfaceLines.join('\n');
				const match = interfaceCode.match(/export interface (\w+)/);
				
				if (match) {
					const name = match[1]!;

					if (!module[filePath]) 
						module[filePath] = {};

					const { memberNames, memberTypes, memberValues } = getObjectMembers(module, retryList, filePath, name, interfaceCode);
					const parsedStr = "{" + interfaceCode.split('{')[1]!.split('}')[0]! + "}";

					module[filePath][name] = { name, value: interfaceCode.replace("export ", ""), type: 'interface', memberNames, memberTypes, memberValues, parsedStr };
				}
			} else if (line.startsWith('export enum ') || line.startsWith('export const enum ')) {
				// Collect multiline enum
				const enumLines = [];
				let braceCount = 0;
				let j = i;

				for (; j < lines.length; j++) {
					const l = lines[j];

					enumLines.push(l);
					braceCount += countBraces(l!);
					
					if (braceCount <= 0 && (l?.trim().endsWith('}') || l?.trim().includes(';'))) break;
				}

				i = j + 1;

				const constEnum = line.startsWith('export const enum ');
				const enumCode = enumLines.join('\n');
				const match = !constEnum
					? enumCode.match(/export enum (\w+)/) 
					: enumCode.match(/export const enum (\w+)/);

				if (match) {
					const name = match[1]!;

					if (!module[filePath]) 
						module[filePath] = {};

					const parsedStr = enumCode.replace(!constEnum ? "export " : "export const ", "").replace("?", " = undefined");

					module[filePath][name] = { name, value: parsedStr, type: 'enum', parsedStr };
				}
			} else if (line.startsWith('export type ')) {
				// Type can be single or multiline
				const typeLines = [];
				let j = i;
				let hasBrace = false;
				let braceCount = 0;

				for (; j < lines.length; j++) {
					const l = lines[j];
					typeLines.push(l);

					if (l?.includes('{')) 
						hasBrace = true;
					
					braceCount += countBraces(l!);
					
					if (!hasBrace && l?.includes(';')) 
						break;
					
					if (hasBrace && braceCount <= 0 && (l?.trim().endsWith('}') || l?.trim().includes(';'))) 
						break;
				}
				i = j + 1;

				const typeCode = typeLines.join('\n');
				const match = typeCode.match(/export type (\w+)/);

				if (match) {
					const name = match[1]!;

					if (!module[filePath]) 
						module[filePath] = {};

					const { memberNames, memberTypes, memberValues } = getObjectMembers(module, retryList, filePath, name, typeCode, true);
					const parsedStr = "{" + typeCode.split('{')[1]!.split('}')[0]! + "}";

					module[filePath][name] = { name, value: typeCode.replace("export ", ""), type: 'type', memberNames, memberTypes, memberValues, parsedStr };
				}
			} else if (line.includes(' = ')) {
				// Variable or arrow function
				const parts = line.split(' = ');

				if (parts.length >= 2) {
					const decl = parts[0]!.trim();
					const valuePart = parts.slice(1).join(' = ').trim().replace(/;$/, '');
					const valueType = inferType(valuePart);
					let name = decl?.replace(/^export\s+(const|let|var)?\s*/, '').trim();
					
					if (valuePart.includes('=>')) {
						// Arrow function
						if (valuePart.trim().endsWith('{')) {
							// Multiline arrow function
							const arrowLines = [];
							let braceCount = 0;
							let j = i;

							for (; j < lines.length; j++) {
								const l = lines[j];

								arrowLines.push(l);
								braceCount += countBraces(l!);

								if (braceCount <= 0 && (l?.trim().endsWith('}') || l?.trim().includes(';'))) break;
							}

							i = j + 1;

							const arrowCode = arrowLines.join('\n');
							const arrowBlock = "{" + arrowCode.split('{')[1]!;

							let header = decl.replace("export ", "");

							if (header.startsWith("const ")) 
								header = header.replace("const ", "");
							if (header.startsWith("let ")) 
								header = header.replace("let ", "");
							if (header.startsWith("var ")) 
								header = header.replace("var ", "");

							const params = valuePart.split('=>')[0]!.trim().replaceAll("?", " = undefined");
							const parsedStr = `${header.trim()} = function${params} ${arrowBlock}`;
							
							if (!module[filePath]) 
								module[filePath] = {};

							module[filePath][name] = { name, value: arrowCode.replace("export ", ""), type: 'method', header, blockValue: arrowBlock, parsedStr };
						} else {
							// Single line arrow function
							let header = decl.replace("export ", "");

							if (header.startsWith("const ")) 
								header = header.replace("const ", "");
							if (header.startsWith("let ")) 
								header = header.replace("let ", "");
							if (header.startsWith("var ")) 
								header = header.replace("var ", "");

							const params = valuePart.split('=>')[0]!.trim().replaceAll("?", " = undefined");
							const body = valuePart.split('=>')[1]!.trim();
							const parsedStr = `${header.trim()} = function${params} { return ${body}; }`;
							
							if (!module[filePath]) 
								module[filePath] = {};

							module[filePath][name] = { name, value: line.replace("export ", ""), type: 'method', header, blockValue: body, parsedStr };
						}
					} else if (valuePart.startsWith('function')) {
						// Function expression
						if (valuePart.trim().endsWith('{')) {
							// Multiline function expression
							const funcLines = [];
							let braceCount = 0;
							let j = i;

							for (; j < lines.length; j++) {
								const l = lines[j];

								funcLines.push(l);
								braceCount += countBraces(l!);

								if (braceCount <= 0 && (l?.trim().endsWith('}') || l?.trim().includes(';'))) break;
							}

							i = j + 1;

							const funcCode = funcLines.join('\n');
							const funcBlock = "{" + funcCode.split('{')[1]!;

							let header = decl.replace("export ", "");

							if (header.startsWith("const ")) 
								header = header.replace("const ", "");
							if (header.startsWith("let ")) 
								header = header.replace("let ", "");
							if (header.startsWith("var ")) 
								header = header.replace("var ", "");

							const parsedStr = `${header.trim()} = ${valuePart.replace(/{\s*$/, funcBlock)}`;

							if (!module[filePath]) 
								module[filePath] = {};

							module[filePath][name] = { name, value: funcCode.replace("export ", ""), type: 'method', header, blockValue: funcBlock, parsedStr };
						} else {
							// Single line function expression (unlikely)
							let header = decl.replace("export ", "");

							if (header.startsWith("const ")) 
								header = header.replace("const ", "");
							if (header.startsWith("let ")) 
								header = header.replace("let ", "");
							if (header.startsWith("var ")) 
								header = header.replace("var ", "");

							const parsedStr = `${header.trim()} = ${valuePart}`;

							if (!module[filePath]) 
								module[filePath] = {};

							module[filePath][name] = { name, value: line.replace("export ", ""), type: 'method', header, blockValue: valuePart, parsedStr };
						}
					} else {
						// Variable
						let varType: 'const' | 'let' | 'var' = 'var';

						if (decl?.includes('const')) 
							varType = 'const';
						else if (decl?.includes('let')) 
							varType = 'let';
						else if (decl?.includes('var')) 
							varType = 'var';

						const noVarKeyword = varType === 'var' && !parts[0]!.includes('var');

						if (!module[filePath]) 
							module[filePath] = {};
						
						if (varType !== "const")
							module[filePath][varType] = { name, value: valuePart, type: valueType, parsedStr: `${noVarKeyword ? '' : 'var '}${name} = ${valuePart};` };
						else
							module[filePath][name] = { name, value: valuePart, type: valueType, parsedStr: `#macro ${name} ${valuePart}` };
					}
				}
			}

			i++;
		}
	}

	for (const retry of retryList) {
		if (!module[retry.filePath]) 
			continue;

		if (!module[retry.filePath]![retry.targetName]) 
			continue;

		switch (module[retry.filePath]![retry.name]!.type) {
			case 'interface': 
				const currInterface = module[retry.filePath]![retry.name] as VortexModuleInterface;
				const extendsInterface = module[retry.filePath]![retry.targetName] as VortexModuleInterface;

				for (const [idx, member] of extendsInterface.memberNames.entries()) {
					currInterface.memberNames.push(member);
					currInterface.memberTypes.push(extendsInterface.memberTypes[idx]!);
					currInterface.memberValues.push(extendsInterface.memberValues[idx]!);
				}
				break;

			case 'type': 
				const currType = module[retry.filePath]![retry.name] as VortexModuleType;
				const extendsType = module[retry.filePath]![retry.targetName] as VortexModuleType;

				for (const [idx, member] of extendsType.memberNames.entries()) {
					currType.memberNames.push(member);
					currType.memberTypes.push(extendsType.memberTypes[idx]!);
					currType.memberValues.push(extendsType.memberValues[idx]!);
				}
				break;
		}
	}

	return module;
}
