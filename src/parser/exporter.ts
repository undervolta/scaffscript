import type { VortexFileGroup, VortexModule } from "@types";

function inferType(value: string): "any" | "string" | "number" | "boolean" | "object" | "method" | "array" | "enum" {
	value = value.trim();
	if (value.startsWith('"') || value.startsWith("'")) return "string";
	if (/^\d/.test(value)) return "number";
	if (value === "true" || value === "false") return "boolean";
	if (value.startsWith("{") || value.includes("=>")) return "method"; // arrow fn
	if (value.startsWith("[")) return "array";
	if (value.startsWith("{")) return "object";
	return "any";
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

/**
 * Get all exported modules from the given files
 * @param files Object with `vortex` and `generate` properties, each containing an array of files
 * @returns Object with all exported modules
 */
export function getExportedModules(files: VortexFileGroup) {
	const module: VortexModule = {
		arrowFn: [],
		class: [],
		const: [],
		enum: [],
		interface: [],
		let: [],
		function: [],
		type: [],
		var: []
	};

	if (files.generate.length == 0 && files.vortex.length == 0)
		return module;

	for (const file of files.vortex) {
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

					if (braceCount <= 0 && l?.trim().endsWith('}')) break;
				}
				i = j + 1;

				const funcCode = funcLines.join('\n');
				const match = funcCode.match(/export function (\w+)/);
				
				if (match) {
					const name = match[1]!;
					module.function.push({ [name]: { name, value: funcCode.replace("export ", ""), type: 'function' } });
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
					
					if (braceCount <= 0 && l?.trim().endsWith('}')) break;
				}

				i = j + 1;

				const classCode = classLines.join('\n');
				const match = classCode.match(/export class (\w+)/);

				if (match) {
					const name = match[1]!;
					module.class.push({ [name]: { name, value: classCode.replace("export ", ""), type: 'class' } });
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
					
					if (braceCount <= 0 && l?.trim().endsWith('}')) break;
				}

				i = j + 1;

				const interfaceCode = interfaceLines.join('\n');
				const match = interfaceCode.match(/export interface (\w+)/);
				
				if (match) {
					const name = match[1]!;
					module.interface.push({ [name]: { name, value: interfaceCode.replace("export ", ""), type: 'interface' } });
				}
			} else if (line.startsWith('export enum ')) {
				// Collect multiline enum
				const enumLines = [];
				let braceCount = 0;
				let j = i;

				for (; j < lines.length; j++) {
					const l = lines[j];

					enumLines.push(l);
					braceCount += countBraces(l!);
					
					if (braceCount <= 0 && l?.trim().endsWith('}')) break;
				}

				i = j + 1;

				const enumCode = enumLines.join('\n');
				const match = enumCode.match(/export enum (\w+)/);

				if (match) {
					const name = match[1]!;
					module.enum.push({ [name]: { name, value: enumCode.replace("export ", ""), type: 'enum' } });
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
					
					if (hasBrace && braceCount <= 0 && l?.trim().endsWith('}')) 
						break;
				}
				i = j + 1;

				const typeCode = typeLines.join('\n');
				const match = typeCode.match(/export type (\w+)/);

				if (match) {
					const name = match[1]!;
					module.type.push({ [name]: { name, value: typeCode.replace("export ", ""), type: 'type' } });
				}
			} else if (line.includes(' = ')) {
				// Variable or arrow function
				const parts = line.split(' = ');

				if (parts.length >= 2) {
					const decl = parts[0]!.trim();
					const valuePart = parts.slice(1).join(' = ').trim().replace(/;$/, '');
					let name = decl?.replace(/^export\s+(const|let|var)?\s*/, '').trim();
					const valueType = inferType(valuePart);

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
								if (braceCount <= 0 && l?.trim().endsWith('}')) break;
							}
							i = j + 1;
							const arrowCode = arrowLines.join('\n');
							module.arrowFn.push({ [name]: { name, value: arrowCode.replace("export ", ""), type: 'method' } });
						} else {
							// Single line arrow function
							module.arrowFn.push({ [name]: { name, value: line.replace("export ", ""), type: 'method' } });
						}
					} else {
						// Variable
						let varType: 'const' | 'let' | 'var' = 'var';

						if (decl?.includes('const')) 
							varType = 'const';
						else if (decl?.includes('let')) 
							varType = 'let';
						
						module[varType].push({ [name]: { name, value: valuePart, type: valueType } });
					}
				}
			}

			i++;
		}
	}

	return module;
}
