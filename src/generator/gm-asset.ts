import {
	type GMProject,
	type GMResourceHandle,
	type ScaffIntegrationSummary,
	type ScaffIntegrationOptions,
	EVENT_TYPE
} from "@types";

import { fsRuntime } from "@runtime";

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

/**
 * Create YY script string
 * @param projectYyp Name of the project
 * @param rescName Name of the script
 * @param dir Directory of the script
 * @param options Integration options
 * @returns YY script string
 */
function createYYScript(projectYyp: string, rescName: string, dir: string, options?: ScaffIntegrationOptions) {
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
 * Create YY object string
 * @param projectYyp Name of the project
 * @param rescName Name of the object
 * @param dir Directory of the object
 * @param eventList List of events
 * @param options Integration options
 * @returns YY object string
 */
function createYYObject(projectYyp: string, rescName: string, dir: string, eventList?: string[], options?: ScaffIntegrationOptions) {
	const dirSplit = dir.split("/");
	const eventStr = eventList?.join("\n") ?? null;

	return `{
  "$GMObject":"",
  "%Name":"${rescName}",
  "eventList":[
    ${eventStr ?? ""}
  ],
  "managed":true,
  "name":"${rescName}",
  "overriddenProperties":[],
  "parent":{
    "name":"${dir !== "" ? dirSplit.pop()! : projectYyp.replace(".yyp", "")}",
    "path":"${dir !== "" ? `folders/${dir}.yy` : projectYyp}",
  },
  "parentObjectId":null,
  "persistent":false,
  "physicsAngularDamping":0.1,
  "physicsDensity":0.5,
  "physicsFriction":0.2,
  "physicsGroup":1,
  "physicsKinematic":false,
  "physicsLinearDamping":0.1,
  "physicsObject":false,
  "physicsRestitution":0.1,
  "physicsSensor":false,
  "physicsShape":1,
  "physicsShapePoints":[],
  "physicsStartAwake":true,
  "properties":[],
  "resourceType":"GMObject",
  "resourceVersion":"2.0",
  "solid":false,
  "spriteId":null,
  "spriteMaskId":null,
  "visible":true,
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
 * Create GM event string
 * @param eventType Event type
 * @param eventNum Event number
 * @param options Integration options
 * @returns GM event string
 */
export function createGMEventStr(eventType: EVENT_TYPE, eventNum: number | string | null, options?: ScaffIntegrationOptions) {
	return `    {"$GMEvent":"v1","%Name":"",${eventNum !== null ? `"collisionObjectId":${typeof eventNum === "string" ? eventNum : null},` : ""}"eventNum":${typeof eventNum === "number" ? eventNum : 0},"eventType":${eventType},"isDnD":${options?.isDnd ?? false},"name":"","resourceType":"GMEvent","resourceVersion":"2.0",},`;
}

/**
 * Create GM resource
 * @param project GM project
 * @param filePath Path to the resource in the GM IDE
 * @param intgContent Integration content
 * @param options Integration options
 * @returns Resource handle
 */
export async function createGMResource(project: GMProject, filePath: string, intgContent: ScaffIntegrationSummary, options?: ScaffIntegrationOptions): Promise<GMResourceHandle> {
	const pathSplit = filePath.split("/");

	if (filePath.includes("scripts")) {
		const yyFilePath = filePath.replace(".gml", ".yy");

		if (!(await fileExists(yyFilePath))) {
			const yyContent = createYYScript(project["%Name"], pathSplit.at(-2)!, intgContent.dirPath, options);

			try {
				await fsRuntime.writeText(yyFilePath, yyContent);

				return { type: "scripts", name: pathSplit.at(-2)!, dir: null };
			} 
			catch (error) {
				console.error(`Failed to create .yy file for ${filePath}: ${error}`);
			}
		}
	} else if (filePath.includes("objects")) {
		const yyFilePath = `${pathSplit.slice(0, -1).join("/")}/${pathSplit.at(-2)!}.yy`;
		
		if (!(await fileExists(yyFilePath))) {
			const yyContent = createYYObject(project["%Name"], pathSplit.at(-2)!, intgContent.dirPath, 
				intgContent.event ? [createGMEventStr(intgContent.event.type!, (intgContent.event.type! === EVENT_TYPE.COLLISION) ? intgContent.event.collObj! : intgContent.event.num!, options)] : [], options
			);

			try {
				await fsRuntime.writeText(yyFilePath, yyContent);

				return { type: "objects", name: pathSplit.at(-2)!, dir: null };
			} 
			catch (error) {
				console.error(`Failed to create .yy file for ${filePath}: ${error}`);
			}
		} else {
			const yyFileSplit = (await fsRuntime.readText(yyFilePath)).split("\n");
			const eventStartIdx = yyFileSplit.findIndex(line => line.includes("eventList"));
			const eventEndIdx = yyFileSplit.findIndex((line, idx) => idx > eventStartIdx && line.includes("]"));
			const existsEvents = yyFileSplit.slice(eventStartIdx + 1, eventEndIdx);
			const typeNum = `${intgContent.event!.type!}|${intgContent.event!.num!}`
			
			const dupe = existsEvents.find(line => {
				const evNum = line.split('eventNum":')[1]?.split(",")[0]!;
				const evType = line.split('eventType":')[1]?.split(",")[0]!;

				return `${evType}|${evNum}` === typeNum;
			});
			
			if (!dupe) {
				const eventStr = createGMEventStr(intgContent.event!.type!, (intgContent.event!.type! === EVENT_TYPE.COLLISION) ? intgContent.event!.collObj! : intgContent.event!.num!, options);
				yyFileSplit.splice(eventEndIdx, 0, eventStr);
				
				try {
					await fsRuntime.writeText(yyFilePath, yyFileSplit.join("\n"));
				} 
				catch (error) {
					console.error(`Failed to modify .yy file for ${filePath}: ${error}`);
				}
			}
		}
	}

	return { type: null, name: null, dir: null };
}

/**
 * Remove GM resource
 * @param filePath Path to the resource in the GM IDE
 * @param scanPath Path to scan for empty folders
 * @param intgContent Integration content
 * @returns Resource handle
 */
export async function removeGMResource(filePath: string, scanPath: string, intgContent: ScaffIntegrationSummary): Promise<GMResourceHandle> {
	const pathSplit = filePath.split("/");

	if (filePath.includes("scripts")) {
		try {
			await fsRuntime.delete(filePath);
			await fsRuntime.delete(filePath.replace(".gml", ".yy"));
	
			pathSplit.pop();
			await deleteDir(pathSplit.join("/"), scanPath);

			return { type: "scripts", name: pathSplit.at(-1)!, dir: intgContent.dirPath };
		} 
		catch (error) {
			console.error(`Failed to remove resource for ${filePath}: ${error}`);
		}
	} 
	else if (filePath.includes("objects")) {
		try {
			await fsRuntime.delete(filePath);
			pathSplit.pop();

			if (intgContent.isNew) {
				await deleteDir(pathSplit.join("/"), scanPath);
				return { type: "objects", name: pathSplit.at(-1)!, dir: intgContent.dirPath };
			} 
			else {
				const yyFilePath = `${pathSplit.join("/")}/${pathSplit.at(-1)!}.yy`;
				const yyFileSplit = (await fsRuntime.readText(yyFilePath)).split("\n");
				const eventStartIdx = yyFileSplit.findIndex(line => line.includes("eventList"));
				const eventEndIdx = yyFileSplit.findIndex((line, idx) => idx > eventStartIdx && line.includes("]"));
				const existsEvents = yyFileSplit.slice(eventStartIdx + 1, eventEndIdx);
				const typeNum = `${intgContent.event!.type!}|${intgContent.event!.num!}`
				
				const evIdx = existsEvents.findIndex(line => {
					const evNum = line.split('eventNum":')[1]?.split(",")[0]!;
					const evType = line.split('eventType":')[1]?.split(",")[0]!;

					return `${evType}|${evNum}` === typeNum;
				});

				if (evIdx > -1) {
					yyFileSplit.splice(eventStartIdx + evIdx + 1, 1);
					await fsRuntime.writeText(yyFilePath, yyFileSplit.join("\n"));
				}
			}
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
	const raw = await fsRuntime.readText(projectPath);
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
			const existsRescs = rawLines.slice(rescStartIdx + 1, rescEndIdx);

			for (const resc of toAddRescs) {
				const name = resc.split('name":"')[1]!.split('",')[0]!;
				const dupe = existsRescs.find(line => line.includes(`"name":"${name}"`));

				if (!dupe) {
					rawLines.splice(rescEndIdx + addedRescCnt, 0, resc);
					addedRescCnt++;
				}
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
		await fsRuntime.writeText(projectPath, res);
	} 
	catch (error) {
		console.error(`Failed to modify project: ${error}`);
	}
}
