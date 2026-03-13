import type {
	VortexConfig,
	VortexIntegration,
	VortexIntegrationStore
} from "@types";

import { 
	resolvePath, 
	normalizePath,
	commonPath,
	log, 
	fileExists,
	clearOutDir
} from "@/utils";


/**
 * Generate source code from the given integration data
 * @param intgData Array of integration data
 * @param config Vortex config
 * @returns Number of files generated
 */
export async function generateSourceCode(intgData: VortexIntegration[], config: VortexConfig): Promise<VortexIntegrationStore> {
	const res: VortexIntegrationStore = {};
	let generatedCnt = 0;

	await clearOutDir();
	log.info(`Output directory cleared. Generating source code...`);

	for (const data of intgData) {
		if (!data) 
			continue;

		let genPath = data.path.replace(commonPath([resolvePath("./out"), data.path]) ?? "", "");
		
		if (config.useGmAssetPath && genPath.includes("scripts")) 
			genPath += "/" + (data.path.split("scripts")[1]?.split("/").pop() ?? "");
		
		const outFile = normalizePath(resolvePath(`./.out${genPath}.gml`));
		const outFileSplit = outFile.split("/");

		if (genPath === "") {
			if (config.onNotFound === "error") {
				log.error(`Failed to generate source code for \x1b[33m${data.path}\x1b[0m. Aborting...`);
				return res;
			} else {
				log.warn(`Failed to generate source code for \x1b[33m${data.path}\x1b[0m. Skipping this file...`);
				continue;
			}
		}

		let body = "";
		const dataLen = data.targets.length;

		// objects resources
		if (config.useGmAssetPath && genPath.includes("objects")) {
			for (const [idx, target] of data.targets.entries()) {
				if (!target.event) {
					body += target.body + "\n";
		
					if (idx < dataLen - 1)
						body += "\n";
				} else {
					const eventFile = normalizePath(resolvePath(`./.out${genPath}/${target.event.fileName}.gml`));
					const objName = eventFile.slice(0, eventFile.lastIndexOf("/"));
					const resolvedGenPath = eventFile.replace(".out/", "");
					const resvGenPathSplit = resolvedGenPath.split("/");
					const outFileName = resvGenPathSplit.pop()!;
					const objectIdx = resvGenPathSplit.findIndex(slug => slug === "objects");

					await Bun.write(eventFile, target.body + "\n");
					data.content[resolvedGenPath] = target.body;
					target.path = resolvedGenPath;
					res[resolvedGenPath] = {
						writePath: `${resvGenPathSplit.slice(0, objectIdx+1).join("/")}/${resvGenPathSplit.slice(-1).join("/")}/${outFileName}`,
						dirPath: `${resvGenPathSplit.slice(objectIdx + 1, -1).join("/")}`,
						content: target.body,
						backup: null,
						event: target.event
					};
					generatedCnt++;
					
					if (!config.noBackup) {
						if (await fileExists(resolvedGenPath)) {
							try {
								target.backup = await Bun.file(resolvedGenPath).text();
								res[resolvedGenPath].backup = target.backup;

								log.info(`Backup created for \x1b[32m${resolvedGenPath}\x1b[0m.`);
							} 
							catch (error) {
								log.error(`Failed to create backup for \x1b[32m${resolvedGenPath}\x1b[0m: ${error}`);
							}
						} 
						else
							log.info(`File: \x1b[33m${resolvedGenPath}\x1b[0m not found. No backup created.`);
					}

					log.info(`Source code generated for \x1b[34m${target.event.name + (target.event.num ? `\x1b[0m:\x1b[36m${target.event.num}\x1b[34m` : "")} Event\x1b[0m in \x1b[32m${objName}\x1b[0m.`);
				}
			}

			if (body !== "") {
				await Bun.write(outFile, body);
				generatedCnt++;
	
				log.info(`Source code generated for \x1b[34m${outFileSplit.pop()}\x1b[0m in \x1b[32m${outFileSplit.join("/")}\x1b[0m. This file won't be integrated to the GM project due to non-regular GM asset path.`);
			} else if (!generatedCnt)
				log.warn(`No source code generated for \x1b[34m${outFileSplit.pop()}\x1b[0m in \x1b[32m${outFileSplit.join("/")}\x1b[0m.`);
		} 
		// scripts resources
		else {
			for (const [idx, target] of data.targets.entries()) {
				body += target.body + "\n";
	
				if (idx < dataLen - 1)
					body += "\n";
			}

			if (body !== "") {
				const resolvedGenPath = normalizePath(resolvePath(`./${genPath}`)) + ".gml";
				const resvGenPathSplit = resolvedGenPath.split("/");
				const outFileName = resvGenPathSplit.pop()!;
				const scriptIdx = resvGenPathSplit.findIndex(slug => slug === "scripts");

				await Bun.write(outFile, body);
				data.content[resolvedGenPath] = body;
				res[resolvedGenPath] = {
					writePath: `${resvGenPathSplit.slice(0, scriptIdx+1).join("/")}/${outFileName.replace(".gml", "")}/${outFileName}`,
					dirPath: `${resvGenPathSplit.slice(scriptIdx + 1, -1).join("/")}`,
					content: body,
					backup: null,
					event: null
				};
				generatedCnt++;
				
				if (!config.noBackup) {

					if (await fileExists(resolvedGenPath)) {
						try {
							data.backup = await Bun.file(resolvedGenPath).text();
							res[resolvedGenPath].backup = data.backup;

							log.info(`Backup created for \x1b[32m${resolvedGenPath}\x1b[0m.`);
						}
						catch (error) {
							log.error(`Failed to create backup for \x1b[32m${resolvedGenPath}\x1b[0m: ${error}`);
						}
					} 
					else
						log.info(`File: \x1b[33m${resolvedGenPath}\x1b[0m not found. No backup created.`);
				}
	
				log.info(`Source code generated for \x1b[34m${outFileSplit.pop()}\x1b[0m in \x1b[32m${outFileSplit.join("/")}\x1b[0m.`);
			} else 
				log.warn(`No source code generated for \x1b[34m${outFileSplit.pop()}\x1b[0m in \x1b[32m${outFileSplit.join("/")}\x1b[0m.`);
		}
	}

	log.info(`All source code generated. Generated \x1b[32m${generatedCnt}\x1b[0m file(s).`);

	return res;
}
