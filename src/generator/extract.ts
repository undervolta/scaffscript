import { 
	intgRegex,
	intgBlockRegex
} from "@/parser/regex";

import type {
	VortexConfig,
	VortexFile,
	VortexIntegration,
	VortexIntegrationBlock
} from "@types";

import { 
	resolvePath, 
	normalizePath, 
	log
} from "@/utils";


/**
 * Extract integration data from the given file content
 * @param file File to extract integration data from
 * @param config Vortex config
 * @returns Array of integration data
 */
export function extractIntegrationData(file: VortexFile, config: VortexConfig): VortexIntegration[] | null {
	const res: VortexIntegration[] = [];
	let invalid = false;

	const blocks: VortexIntegrationBlock[] = [];

	for (const match of file.content.matchAll(intgBlockRegex)) {
		const { name: header, body } = match.groups!;

		const headerSplit = header!.split("as").map(h => h.trim());
		const name = headerSplit[0]!.replace("Event", "");
		const event = headerSplit[0]!.endsWith("Event") ? name : (headerSplit[1] ?? null);

		if (!name || !body) {
			if (config.onNotFound === "error") {
				log.error(`Invalid integration block found: \x1b[34m#[${match[0]}]\x1b[0m. Aborting...`);
				return null;
			} else {
				log.warn(`Invalid integration block found: \x1b[34m#[${match[0]}]\x1b[0m. Skipping this block...`);
				continue;
			}
		}

		/// TODO: parse the event name

		if (config.debugLevel >= 1)
			log.debug(`Integration block found: \x1b[34m#[${name}]\x1b[0m in \x1b[33m${file.name}\x1b[0m from \x1b[32m${file.path}\x1b[0m.`);

		blocks.push({
			name,
			body: body.trim(),
			event
		});
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
				backup: null
			});
		} else {
			const targetsArr = !targets.startsWith("{") ? [targets] : targets.slice(1, -1).split(",").map(t => t.trim());
			
			res.push({
				path: targetPath,
				targets: [],
				backup: null
			});
			
			for (const target of targetsArr) {
				const targetBlock = blocks.find(b => b.name === target);

				if (!targetBlock) {
					if (config.onNotFound === "error") {
						log.error(`Target \x1b[33m${target}\x1b[0m not found for integration statement: \x1b[34m${match[0]}\x1b[0m. Aborting...`);
						invalid = true;
					} else
						log.warn(`Target \x1b[33m${target}\x1b[0m not found for integration statement: \x1b[34m${match[0]}\x1b[0m. Skipping this statement...`);
					
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
