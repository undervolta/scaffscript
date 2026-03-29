import { 
	modControlRegex, 
	contentModRegex, 
	contentModShortRegex,
	useModRegex,
	getTabLevels
} from "@/parser/regex";

import { insertTabs } from "@/parser/export-module";

import { resolvePath, normalizePath, log, fileExists, swapAndPop } from "@/utils";

import type { 
	ScaffConfig,
	ScaffFile,
	ScaffFileGroup,
	ScaffModuleStore,
	ScaffModule,
	ScaffModuleUsage,
	ScaffModuleInterface
} from "@types";

import { fsRuntime } from "@runtime";


function countTabsBeforeSubstring(str: string, sub: string, tabChar: string): number {
	const idx = str.indexOf(sub);
	if (idx === -1) return -1;

	const lineStart = str.lastIndexOf('\n', idx - 1) + 1;
	const segment = str.slice(lineStart, idx);
	
	let count = 0;
	for (const ch of segment) {
		if (ch === tabChar) count++;
		else break; 
	}

	return count;
}

function resolveImportPath(filePath: string, importPath: string, config: ScaffConfig): string {
	if (!config.path)
		return resolvePath(`${filePath}/${importPath}`);

	const useWildcard = Object.keys(config.path)
		.filter(k => k.endsWith("*"))
		.find(k => importPath.startsWith(k.slice(0, -1)));

	if (useWildcard) {
		const pathAlias = config.path[useWildcard]?.replace("*", "");
		const dynPath = importPath.replace(useWildcard.slice(0, -2), "");
		
		if (!pathAlias) {
			log.error(`Path \x1b[33m${importPath}\x1b[0m not found in path aliases. Aborting...`);
			return "";
		}

		if (pathAlias.startsWith('~')) {
			return resolvePath(`${config.source}/${pathAlias.replace('~/', "").replace('~', "")}${dynPath}`);
		}

		return resolvePath(`${filePath}/${pathAlias}${dynPath}`);

	}
	else if (config.path[importPath]) {
		const pathAlias = config.path[importPath];
		
		if (pathAlias.startsWith('~')) {
			return resolvePath(`${config.source}/${pathAlias.replace('~/', "").replace('~', "")}`);
		}

		return resolvePath(`${filePath}/${pathAlias}`);
	}

	return resolvePath(`${filePath}/${importPath}`);
}


/**
 * Get all imported modules from the given file
 * @param module Object with all exported modules
 * @param fileGroup Object with `scaff` and `generate` properties, each containing an array of files
 * @param file File to search in
 * @param config Scaff config
 * @returns Array of used modules
 */
export async function getModuleUsage(module: ScaffModuleStore, fileGroup: ScaffFileGroup, file: ScaffFile, config: ScaffConfig): Promise<ScaffModuleUsage[] | null> {
	const matches = [...file.content.matchAll(modControlRegex)];
	const limit = 10;
	const results: ScaffModuleUsage[] = [];

	let isInvalid = false;

	for (let i = 0; i < matches.length; i += limit) {
		const batch = matches.slice(i, i + limit);

		const res = await Promise.all(batch.map(async match => {
			const { cmd, mod, /*src,*/ path } = match.groups!;
			const res: ScaffModuleUsage = {
				cmd: null,
				files: null,
				modList: null,
				targetPath: null,
				targetStr: ""
			};
			
			if (!(cmd && mod /*&& src*/ && path)) {
				log.error(`Invalid module control statement: \x1b[34m${cmd} ${mod} from ${path}\x1b[0m in \x1b[33m${file.name}\x1b[0m from \x1b[32m${file.path}\x1b[0m. Aborting...`);
				isInvalid = true;
				return null;
			}
			
			const fromPath = normalizePath(resolveImportPath(file.path, path.slice(1, -1), config));
			const modList: Record<string, ScaffModule> = {};
			const alias: Record<string, string> = {};
			
			if (!module[fromPath]) {
				// try to load the path as a normal GML file
				if (cmd === "include" && (mod.startsWith('{') && (mod.includes('"') || mod.includes("'")))) {
					const files = mod.slice(1, -1).split(',').map(m => m.trim());
					const filePaths: (string | ScaffFile)[] = []; 

					for (const f of files) {
						const filePath = normalizePath(resolvePath(`${file.path}/${f.slice(1, -1)}`));
						const targetFile = fileGroup.normal.find(fl => {
							let targetFile = `${fl.path}/${fl.name}`;
							let currFile = filePath;

							if (!targetFile.endsWith(".gml"))
								targetFile += ".gml";
							if (!currFile.endsWith(".gml"))
								currFile += ".gml";

							return targetFile === currFile;
						});

						if (targetFile) 
							filePaths.push(targetFile);
						else if (await fileExists(filePath))
							filePaths.push(filePath);
						else {
							if (config.onNotFound === "error") {
								log.error(`File \x1b[33m${f.slice(1, -1)}\x1b[0m from \x1b[32m${file.path}\x1b[0m not found. Aborting...`);
								isInvalid = true;
								return null;
							} else
								log.warn(`File \x1b[33m${f.slice(1, -1)}\x1b[0m from \x1b[32m${file.path}\x1b[0m not found. Skipping this file...`);
						}
					}
					
					return {
						cmd: cmd as "export" | "import" | "include", 
						files: filePaths,
						modList, 
						targetPath: fromPath,
						targetStr: match[0]!
					};
				}

				log.error(`Path \x1b[33m${fromPath}\x1b[0m doesn't have any exported modules. Aborting...`);
				isInvalid = true;
				return null;
			}

			if (mod === '*' || (mod.startsWith('{') && mod.endsWith('}'))) {
				const targetMods = (mod === '*') 
					? null : mod.slice(1, -1).split(',').map(m => {
						const split = m.split(':');
						const key = split[0]!.trim();

						if (split.length === 1)
							alias[key] = key;
						else
							alias[key] = split[1]!.trim();

						if (!module[fromPath]) {
							if (config.onNotFound === "error") {
								log.error(`Path \x1b[33m${fromPath}\x1b[0m doesn't have any exported modules. Aborting...`);
								isInvalid = true;
							} else
								log.warn(`Path \x1b[33m${fromPath}\x1b[0m doesn't have any exported modules. Skipping this module...`);
								
							return null;
						}
						
						if (!module[fromPath][key]) {
							if (config.onNotFound === "error") {
								log.error(`Module \x1b[33m${key}\x1b[0m from \x1b[32m${fromPath}\x1b[0m not found. Aborting...`);
								isInvalid = true;
							} else
								log.warn(`Module \x1b[33m${key}\x1b[0m from \x1b[32m${fromPath}\x1b[0m not found. Skipping this module...`);
								
							return null;
						}

						return key;
					}).filter(Boolean);
				
				Object.entries(module[fromPath])
					.forEach(([key, value]) => {
						if (mod === '*') 
							modList[key] = { name: key, as: key, value, usingAlias: false };
						else if (targetMods!.includes(key)) {
							const usingAlias = (key in alias && alias[key] !== key);

							modList[alias[key] ?? key] = { name: key, as: alias[key] ?? key, value, usingAlias };

							if (usingAlias) {
								if (!module[fromPath]) 
									module[fromPath] = {};

								module[fromPath][`@${alias[key]}`] = value;
							}
						}
					});
			} 
			else {
				if (!module[fromPath][mod]) {
					if (config.onNotFound === "error") {
						log.error(`Module \x1b[33m${mod}\x1b[0m from \x1b[32m${fromPath}\x1b[0m not found. Aborting...`);
						isInvalid = true;
					} else
						log.warn(`Module \x1b[33m${mod}\x1b[0m from \x1b[32m${fromPath}\x1b[0m not found. Skipping this module...`);
						
					return res;
				}

				modList[mod] = { name: mod, as: mod, value: module[fromPath][mod], usingAlias: false };
			}

			return {
				cmd: cmd as "export" | "import" | "include", 
				files: null,
				modList, 
				targetPath: fromPath,
				targetStr: match[0]!
			};
		}));

		if (isInvalid) break;

		results.push(...res);
	}

	return (!isInvalid && results.every(r => r)) ? results : null;
}

export async function implementModules(module: ScaffModuleStore, fileGroup: ScaffFileGroup, file: ScaffFile, config: ScaffConfig, mods?: ScaffModuleUsage[] | null) {
	if (!mods) 
		mods = await getModuleUsage(module, fileGroup, file, config);
	
	if (!mods) 
		return null;

	// remove all import and export statements
	const toRemove = [...file.content.matchAll(modControlRegex)];
	for (const rm of toRemove) {
		if (rm.groups?.cmd !== "include")
			file.content = file.content.replace(rm[0]!, "");
	}

	for (const mod of mods) {
		if (!mod) 
			return null;

		if (!mod.cmd)
			return null;

		switch (mod.cmd) {
			case "export":	
				const thisPath = file.isIndex ? file.path : `${file.path}/${file.name}`;
				
				if (!module[thisPath]) 
					module[thisPath] = {};

				Object.entries(mod.modList!)
					.forEach(([_, value]) => {
						module[thisPath]![value.as] = value.value;
					});
				
				//console.log(`Module from ${thisPath}: ${JSON.stringify(module[thisPath], null, 2)}`);
				break;

			case "include":
				let toReplace = "";

				if (!mod.files) {
					if (!mod.modList) 
						return null;

					const modEntries = Object.entries(mod.modList);
					const modLen = modEntries.length;
					const modIterator = modEntries.entries();

					for (const [idx, [_, include]] of modIterator) {
						if (idx > 0) switch (include.value.type) {
							case "object":
							case "method":
							case "array":
							case "enum":
								toReplace += "\n";
								break;
						}

						toReplace += include.value.parsedStr + "\n";
						
						if (idx === modLen - 1)
							toReplace += "\n";
					}

					file.content = file.content.replace(mod.targetStr, toReplace);
				} else {
					for (const fileOrPath of mod.files) {
						if (typeof fileOrPath === "string") {
							const content = await fsRuntime.readText(fileOrPath);
							
							toReplace += content + "\n\n";
						} else
							toReplace += fileOrPath.content + "\n\n";
					}

					file.content = file.content.replace(mod.targetStr, toReplace);
				}
				break;

			case "import":
				//file.content = file.content.replace(mod.targetStr, "");

				const cmdMatches = [...file.content.matchAll(contentModRegex)];
				const shortCmdMatches = [...file.content.matchAll(contentModShortRegex)];
				const useMatches = [...file.content.matchAll(useModRegex)];

				for (const match of cmdMatches) {
					const { cmd: contentCmd, mod: contentMod } = match.groups!;

					if (!contentCmd || !contentMod) {
						log.error(`Invalid content module statement: \x1b[34m${contentCmd} ${contentMod}\x1b[0m in \x1b[33m${file.name}\x1b[0m from \x1b[32m${file.path}\x1b[0m. Aborting...`);
						return null;
					}

					// skip if the module is not found
					if (!(`@${contentMod}` in mod.modList!) && !(contentMod in mod.modList!))
						continue;

					if (config.debugLevel >= 1)
						log.debug(`Content module statement found: \x1b[34m${contentCmd} ${contentMod}\x1b[0m in \x1b[33m${file.name === '' ? "index" : file.name}\x1b[0m from \x1b[32m${file.path}\x1b[0m.`);

					let parsedStr = "";

					switch (contentCmd) {
						case "content":
							const tabChar = (config.tabType === "1t") ? '\t' : (config.tabType === "2s" ? '  ' : '    ');
							const tabCnt = countTabsBeforeSubstring(file.content, match[0]!, tabChar);
							
							parsedStr = module[mod.targetPath!]![(`@${contentMod}` in module[mod.targetPath!]!) ? `@${contentMod}` : contentMod]!.parsedStr;
							
							if (tabCnt > 0) {
								const tabLevels = getTabLevels(parsedStr, config.tabType).map(l => l + tabCnt);

								file.content = file.content
									.replace(match[0]!, parsedStr
										.split('\n')
										.map((l, i) => tabLevels[i] ? (insertTabs(tabLevels[i], config.tabType) + l) : l)
										.join('\n'));
							} else
								file.content = file.content.replace(match[0]!, parsedStr);
							break;

						case "nameof":
							parsedStr = module[mod.targetPath!]![(`@${contentMod}` in module[mod.targetPath!]!) ? `@${contentMod}` : contentMod]!.name;
							
							file.content = file.content.replace(`@nameof ${contentMod}`, parsedStr);
							break;

						case "typeof":
							parsedStr = module[mod.targetPath!]![(`@${contentMod}` in module[mod.targetPath!]!) ? `@${contentMod}` : contentMod]!.type;
							
							file.content = file.content.replace(`@typeof ${contentMod}`, `"${parsedStr}"`);
							break;

						case "valueof":
							parsedStr = module[mod.targetPath!]![(`@${contentMod}` in module[mod.targetPath!]!) ? `@${contentMod}` : contentMod]!.value;
							
							file.content = file.content.replace(`@valueof ${contentMod}`, parsedStr);
							break;
					}
				}

				for (const match of shortCmdMatches) {
					const { mod: contentMod } = match.groups!;

					if (!contentMod) {
						log.error(`Invalid content module statement: \x1b[34m@:${contentMod}\x1b[0m in \x1b[33m${file.name}\x1b[0m from \x1b[32m${file.path}\x1b[0m. Aborting...`);
						return null;
					}

					if (config.debugLevel >= 1)
						log.debug(`Valueof module statement found: \x1b[34m${contentMod}\x1b[0m in \x1b[33m${file.name}\x1b[0m from \x1b[32m${file.path}\x1b[0m.`);

					// skip if the module is not found
					if (!(`@${contentMod}` in mod.modList!) && !(contentMod in mod.modList!))
						continue;

					const parsedStr = module[mod.targetPath!]![(`@${contentMod}` in module[mod.targetPath!]!) ? `@${contentMod}` : contentMod]!.value;
					
					file.content = file.content.replace(`@:${contentMod}`, parsedStr);
				}

				for (const match of useMatches) {
					const { mod: contentMod, body } = match.groups!;

					if (!contentMod || !body) {
						log.error(`Invalid content module statement: \x1b[34m@use ${contentMod} ${body}\x1b[0m in \x1b[33m${file.name}\x1b[0m from \x1b[32m${file.path}\x1b[0m. Aborting...`);
						return null;
					}

					// skip if the module is not found
					if (!(`@${contentMod}` in mod.modList!) && !(contentMod in mod.modList!))
						continue;

					if (config.debugLevel >= 1)
						log.debug(`Use module statement found: \x1b[34m@use ${contentMod} ${body}\x1b[0m in \x1b[33m${file.name}\x1b[0m from \x1b[32m${file.path}\x1b[0m.`);

					
					const lines = body.slice(1, -1).split('\n').filter(Boolean);
					const pairs = lines.map(l => l.split(':').map(p => {
						const delimIdx = p.lastIndexOf(',');
						
						return p.slice(0, delimIdx === -1 ? undefined : delimIdx).trim();
					}));

					const tabChar = config.tabType === "1t" ? '\t' : (config.tabType === "2s" ? '  ' : '    ');
					const tabCnt = countTabsBeforeSubstring(file.content.slice(file.content.lastIndexOf('\n', match.index), match.index + match[0]!.length), "@", tabChar);
					const tabLevels = getTabLevels(body, config.tabType).map(l => l + tabCnt);
					
					const currMod = module[mod.targetPath!]![(`@${contentMod}` in module[mod.targetPath!]!) ? `@${contentMod}` : contentMod]! as ScaffModuleInterface;
					const modMember = Object.entries(currMod.member);
					const tabLevel = tabCnt + tabLevels[Math.min(1, tabLevels.length - 1)]!;

					let res = "{\n";
					for (const [idx, [mName, mVal]] of modMember.entries()) {
						const pairIdx = pairs.findIndex(p => p[0] === mName);
						const pair = pairIdx > -1 ? pairs[pairIdx]! : null;
						const value = pair 
							? (pair.length === 2 ? pair[1]! : mVal.value) 
							: mVal.value;

						if (value) {
							res += `${insertTabs(tabLevel, config.tabType)}${mName}: ${value}${idx < modMember.length - 2 ? "," : ""}\n`;
						}

						if (pairIdx > -1)
							swapAndPop(pairs, pairIdx);
					}

					for (const [idx, pair] of pairs.entries()) {
						if (idx === 0) 
							res = res.slice(0, -1) + ",\n";

						res += `${insertTabs(tabLevel, config.tabType)}${pair[0]}: ${pair[1]}${idx < pairs.length - 1 ? "," : ""}\n`;
					}
					res += insertTabs(tabCnt, config.tabType) + "}";

					file.content = file.content.replace(match[0]!, res);
				}
				break;
		}
		
		file.content = file.content.trim() + "\n";

		//if (mod.cmd !== "export" && config.debugLevel >= 2) 
		//	log.debug(`Content of '${file.name}' after \x1b[36m${mod.cmd}\x1b[0m:\n${file.content}`);
	}

	return mods;
}
