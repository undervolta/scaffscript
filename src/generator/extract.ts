import { 
	intgRegex,
	intgBlockRegex
} from "@/parser/regex";

import type {
	ScaffConfig,
	ScaffFile,
	ScaffIntegration,
	ScaffIntegrationBlock,
	ScaffIntegrationBlockFlags,
	GMEvent
} from "@types";

import { 
	EVENT_TYPE,
	EVENT,
	EventName,
} from "@types";

import { 
	resolvePath, 
	normalizePath, 
	log
} from "@/utils";


function getEventFile(eventInput: string, numInput: string): GMEvent {
	let event: EVENT_TYPE | null = 0;
	let needNum = true;
	let dynNum = false;

	switch (eventInput.toLowerCase()) {
		case "create": 
			event = EVENT_TYPE.CREATE; needNum = false; break;
		case "destroy": 
			event = EVENT_TYPE.DESTROY; needNum = false; break;
		case "alarm": 
			event = EVENT_TYPE.ALARM; break;
		case "step": 
			event = EVENT_TYPE.STEP; break;
		case "collision": 
			event = EVENT_TYPE.COLLISION; dynNum = true; break;
		case "keydown": case "key_down": case "keyboard": 
			event = EVENT_TYPE.KEY_DOWN; break;
		case "mouse": 
			event = EVENT_TYPE.MOUSE; break;
		case "other": case "async":
			event = EVENT_TYPE.OTHER; break;
		case "draw": 
			event = EVENT_TYPE.DRAW; break;
		case "keypress": case "key_press": 
			event = EVENT_TYPE.KEY_PRESS; break;
		case "keyrelease": case "key_release": 
			event = EVENT_TYPE.KEY_RELEASE; break;
		case "cleanup": case "clean_up": 
			event = EVENT_TYPE.CLEAN_UP; break;
		case "gesture": 
			event = EVENT_TYPE.GESTURE; break;
		default: 
			event = null;
	}
	
	if (event === null) 
		return { type: null, needNum: false, dynamicNum: false, num: null, numStr: null, name: null, fileName: null, collObj: null };

	const name = EventName[event];
	let numStr = (event === EVENT_TYPE.COLLISION) ? numInput : numInput.toUpperCase();
	
	if ((needNum && !dynNum && !(numStr in EVENT))) 
		return { type: event, needNum, dynamicNum: dynNum, num: null, numStr, name, fileName: null, collObj: null };

	return {
		type: event,
		num: EVENT[numStr as keyof typeof EVENT] ?? 0,
		needNum,
		dynamicNum: dynNum,
		numStr,
		name,
		fileName: (event === EVENT_TYPE.COLLISION) ? `${name}_${numInput}` : `${name}_${EVENT[numStr as keyof typeof EVENT] ?? 0}`,
		collObj: (event === EVENT_TYPE.COLLISION) ? `{"name":"${numInput}","path":"objects/${numInput}/${numInput}.yy",}` : null
	}
}

/**
 * Extract integration data from the given file content
 * @param file File to extract integration data from
 * @param config Scaff config
 * @returns Array of integration data
 */
export function extractIntegrationData(file: ScaffFile, config: ScaffConfig): ScaffIntegration[] | null {
	const res: ScaffIntegration[] = [];
	let invalid = false;

	const blocks: ScaffIntegrationBlock[] = [];

	for (const match of file.content.matchAll(intgBlockRegex)) {
		const { name: header, body } = match.groups!;

		const flags: (keyof ScaffIntegrationBlockFlags)[] = header!.split("--")[1]?.split(" ").map(f => f.trim()) as (keyof ScaffIntegrationBlockFlags)[] ?? [];
		const headerSplit = header!.split("--")[0]!.split("as").map(h => !h.includes("collision") ? h.trim().toLowerCase() : h.trim());
		const name = headerSplit[0]!.replace("event", "").replace("ev", "").trim();
		const eventType = (headerSplit[0]!.endsWith("event") || headerSplit[0]!.endsWith("ev")) ? name : (headerSplit[1] ?? null);

		if (!name || !body) {
			if (config.onNotFound === "error") {
				log.error(`Invalid integration block found: \x1b[34m${match[0]}\x1b[0m. Aborting...`);
				return null;
			} else {
				log.warn(`Invalid integration block found: \x1b[34m${match[0]}\x1b[0m. Skipping this block...`);
				continue;
			}
		}

		let event: GMEvent | null = null;

		if (eventType) {
			const eventSplit = eventType.split(":").filter(Boolean).map(e => e.trim());

			event = getEventFile(eventSplit[0]!, eventSplit[1] ?? "");
			
			if (event.type === null) {
				if (config.onNotFound === "error") {
					log.error(`Invalid event type \x1b[33m${eventType}\x1b[0m found: \x1b[34m#[${header}]\x1b[0m. Aborting...`);
					return null;
				} else {
					log.warn(`Invalid event type \x1b[33m${eventType}\x1b[0m found: \x1b[34m#[${header}]\x1b[0m. Skipping this block...`);
					continue;
				}
			} else if (event.numStr === null && event.needNum) {
				if (config.onNotFound === "error") {
					log.error(`Invalid event number \x1b[33m${event.numStr}\x1b[0m found: \x1b[34m#[${header}]\x1b[0m. Aborting...`);
					return null;
				} else {
					log.warn(`Invalid event number \x1b[33m${event.numStr}\x1b[0m found: \x1b[34m#[${header}]\x1b[0m. Skipping this block...`);
					continue;
				}
			}
		}

		if (config.debugLevel >= 1)
			log.debug(`Integration block found: \x1b[34m#[${name}]\x1b[0m in \x1b[33m${file.name}\x1b[0m from \x1b[32m${file.path}\x1b[0m.`);
		
		// process flags
		let processedBody = body.trim();

		if (flags.includes("debug") && config.debugLevel >= 1) 
			processedBody = "";
		if ((flags.includes("dev") || flags.includes("development")) && config.production) 
			processedBody = "";
		if ((flags.includes("prod") || flags.includes("production")) && !config.production) 
			processedBody = "";
		if (flags.includes("skip") || flags.includes("disabled")) 
			processedBody = "";

		if (config.targetPlatform !== "all") {
			const platformExclusion = flags.find(f => f.startsWith("!"));
			
			if (platformExclusion) {
				if (platformExclusion.slice(1) === config.targetPlatform)
					processedBody = "";
			} 
			else if (!flags.includes(config.targetPlatform) && !flags.includes("all"))
				processedBody = "";
		} 

		const existsBlock = blocks.find(b => b.name === name);
		if (existsBlock) {
			existsBlock.body += (existsBlock.body !== "" ? "\n\n" : "") + processedBody;
			
			if (flags.find(f => f === "exclude") && !existsBlock.removeBodies.includes(processedBody))
				existsBlock.removeBodies.push(processedBody);
		}
		else {
			blocks.push({
				name,
				body: processedBody,
				path: "",
				event,
				backup: null,
				flags: flags,
				removeBodies: flags.find(f => f === "exclude") ? [processedBody] : []
			});
		}
	}
	
	[...file.content.matchAll(intgRegex)].forEach(match => {
		if (invalid) 
			return;

		const { targets, path } = match.groups!;

		if (!targets || !path) {
			if (config.onNotFound === "error") {
				log.error(`Invalid integration statement found: \x1b[34m${match[0]}\x1b[0m in \x1b[33m${file.name}\x1b[0m from \x1b[32m${file.path}\x1b[0m. Aborting...`);
				invalid = true;
			}
			else 
				log.warn(`Invalid integration statement found: \x1b[34m${match[0]}\x1b[0m in \x1b[33m${file.name}\x1b[0m from \x1b[32m${file.path}\x1b[0m. Skipping this statement...`);
			
			return;
		}

		const targetPath = normalizePath(resolvePath(path.slice(1, -1))).replace(".gml", "");
		
		if (targets === "*") {
			if (config.debugLevel >= 1)
				log.debug(`Integration statement found: \x1b[34mintg * to ${path}\x1b[0m in \x1b[33m${file.name}\x1b[0m from \x1b[32m${file.path}\x1b[0m.`);

			res.push({
				path: targetPath,
				targets: blocks,
				backup: null,
				content: {}
			});
		} else {
			const targetsArr = !targets.startsWith("{") ? [targets] : targets.slice(1, -1).split(",").map(t => t.trim());
			
			res.push({
				path: targetPath,
				targets: [],
				backup: null,
				content: {}
			});
			
			for (const target of targetsArr) {
				if (!target) continue;
				
				const targetBlock = blocks.find(b => b.name === target.toLowerCase());

				if (!targetBlock) {
					if (config.onNotFound === "error") {
						log.error(`Target \x1b[33m${target}\x1b[0m not found for integration targets: \x1b[34m${targets}\x1b[0m. Aborting...`);
						invalid = true;
					} else
						log.warn(`Target \x1b[33m${target}\x1b[0m not found for integration targets: \x1b[34m${targets}\x1b[0m. Skipping this statement...`);
					
					return;
				}

				if (config.debugLevel >= 1)
					log.debug(`Integration statement found: \x1b[34mintg ${target} to ${path}\x1b[0m in \x1b[33m${file.name === '' ? "index" : file.name}\x1b[0m from \x1b[32m${file.path}\x1b[0m.`);

				res.at(-1)!.targets.push(targetBlock);
			}
		}
	});

	if (invalid) 
		return null;

	return res;
}
