import type {
	GMProject,
	GMResourceHandle,
	VortexIntegrationSummary,
	VortexIntegrationOptions
} from "@types";

import {
	fileExists,
	deleteDir
} from "@/utils";



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


function createYYScript(projectYyp: string, rescName: string, dir: string, options?: VortexIntegrationOptions) {
	const dirSplit = dir.split("/");

	return `{
  "$GMScript":"v1",
  "%Name":"${rescName}",
  "isCompatibility":false,
  "isDnD":${options?.isDnd ?? false},
  "name":"${rescName}",
  "parent":{
    "name":"${dir !== "" ? dirSplit.pop()! : projectYyp.replace(".yyp", "")}",
    "path":"${dir !== "" ? `folders/${dir}.yy` : projectYyp}",
  },
  "resourceType":"GMScript",
  "resourceVersion":"2.0",
}`;
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


/**
 * Create GM folder string
 * @param name Folder name
 * @param path Folder path
 * @returns GM folder string
 */
export function createGMFolderStr(path: string) {
	const name = path.split("/").pop()!;

	return `    {"$GMFolder":"","%Name":"${name}","folderPath":"folders/${path}.yy","name":"${name}","resourceType":"GMFolder","resourceVersion":"2.0",},`;
}

/**
 * Create GM resource string
 * @param type Resource type
 * @param name Resource name
 * @param dir Resource directory
 * @returns GM resource string
 */
export function createGMResourceStr(type: "scripts" | "objects", name: string) {
	return `    {"id":{"name":"${name}","path":"${type}/${name}/${name}.yy",},},`;
}

/**
 * Create GM resource (currently only supports scripts)
 * @param project GM project
 * @param filePath Path to the resource in the GM IDE
 * @param intgContent Integration content
 * @param options Integration options
 * @returns Resource handle
 */
export async function createGMResource(project: GMProject, filePath: string, intgContent: VortexIntegrationSummary, options?: VortexIntegrationOptions): Promise<GMResourceHandle> {
	const pathSplit = filePath.split("/");

	if (filePath.includes("scripts")) {
		if (!(await fileExists(filePath.replace(".gml", ".yy")))) {
			const yyFilePath = filePath.replace(".gml", ".yy");
			const yyContent = createYYScript(project["%Name"], pathSplit.at(-2)!, intgContent.dirPath, options);

			try {
				await Bun.write(yyFilePath, yyContent);

				return { type: "scripts", name: pathSplit.at(-2)!, dir: null };
			} catch (error) {
				console.error(`Failed to create .yy file for ${filePath}: ${error}`);
			}
		}
	}

	return { type: null, name: null, dir: null };
}

/**
 * Remove GM resource (currently only supports scripts)
 * @param filePath Path to the resource in the GM IDE
 * @param scanPath Path to scan for empty folders
 * @param intgContent Integration content
 * @returns Resource handle
 */
export async function removeGMResource(filePath: string, scanPath: string, intgContent: VortexIntegrationSummary): Promise<GMResourceHandle> {
	const pathSplit = filePath.split("/");

	if (filePath.includes("scripts")) {
		try {
			await Bun.file(filePath).delete();
			await Bun.file(filePath.replace(".gml", ".yy")).delete();
	
			pathSplit.pop();
			await deleteDir(pathSplit.join("/"), scanPath);

			return { type: "scripts", name: pathSplit.at(-1)!, dir: intgContent.dirPath };
		} 
		catch (error) {
			console.error(`Failed to remove resource for ${filePath}: ${error}`);
		}
	}

	return { type: null, name: null, dir: null };
}

/**
 * Modify the given GM project by adding the given resource and/or folder
 * @param projectPath Path to the GM project
 * @param resource Resource to add
 * @param folder Folder to add
 */
export async function modifyYyProject(type: "add" | "remove", projectPath: string, resource: string | string[] | null = null, folder: string | string[] | null = null) {
	const raw = await Bun.file(projectPath).text();
	const rawLines = raw.split("\n");

	const toAddRescs = (resource !== null && !Array.isArray(resource)) ? [resource] : resource;
	const toAddFolders = (folder !== null && !Array.isArray(folder)) ? [folder] : folder;

	if (type === "add") {
		let addedFolderCnt = 0;
		if (toAddFolders) {
			const folderStartIdx = rawLines.findIndex(line => line.includes("Folders"));
			const folderEndIdx = rawLines.findIndex((line, idx) => idx > folderStartIdx && line.includes("]"));
			const existsFolders = rawLines.slice(folderStartIdx + 1, folderEndIdx);
			
			for (const folderDir of toAddFolders) {
				const folderSplit = folderDir.split("/");

				for (let i = 0; i < folderSplit.length; i++) {
					let name = "";

					for (let j = 0; j < i + 1; j++) {
						name += folderSplit[j] + "/";
					}
					name = name.slice(0, -1);

					const dupe = existsFolders.find(line => line.includes(`"%Name":"${name}"`));

					if (!dupe) {
						rawLines.splice(folderEndIdx + addedFolderCnt, 0, createGMFolderStr(name));
						addedFolderCnt++;
					}
				}
			}
		}
	
		let addedRescCnt = 0;
		if (toAddRescs) {
			const rescStartIdx = rawLines.findIndex(line => line.includes("resources"));
			const rescEndIdx = rawLines.findIndex((line, idx) => idx > rescStartIdx && line.includes("]"));	
			
			for (const [idx, r] of toAddRescs.entries()) {
				rawLines.splice(rescEndIdx + idx, 0, r);
				addedRescCnt++;
			}
		}
	} else {
		if (toAddRescs) {
			const rescStartIdx = rawLines.findIndex(line => line.includes("resources"));
			let rescEndIdx = rawLines.findIndex((line, idx) => idx > rescStartIdx && line.includes("]"));	
			
			for (const resc of toAddRescs) {
				const [type, name] = resc.split(",");

				if (!type || !name) 
					continue;
				
				const rescIdx = rawLines.findIndex((line, idx) => idx > rescStartIdx && idx < rescEndIdx && line.includes(`name":"${name}`));
				
				if (rescIdx > -1) {
					rawLines.splice(rescIdx, 1);
					rescEndIdx--;
				}
			}
		}
	}

	const res = rawLines.join("\n");
	//console.log(`res: ${res}`);

	try {
		await Bun.write(projectPath, res);
	} 
	catch (error) {
		console.error(`Failed to modify project: ${error}`);
	}
}
