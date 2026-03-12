import type {
	VortexConfig,
	VortexIntegration
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
export async function generateSourceCode(intgData: VortexIntegration[], config: VortexConfig): Promise<number> {
	await clearOutDir();

	log.info(`Output directory cleared. Generating source code...`);

	let generatedCnt = 0;

	for (const data of intgData) {
		if (!data) 
			continue;

		if (!config.noBackup && (await fileExists(data.path)))
			data.backup = await Bun.file(data.path).text();
		
		let genPath = data.path.replace(commonPath([resolvePath("./out"), data.path]) ?? "", "");
		
		if (config.useGmAssetPath && genPath.includes("scripts")) 
			genPath += "/" + data.path.split("scripts")[1];
		
		const outFile = normalizePath(resolvePath(`./.out${genPath}.gml`));
		const outFileSplit = outFile.split("/");

		if (genPath === "") {
			if (config.onNotFound === "error") {
				log.error(`Failed to generate source code for \x1b[33m${data.path}\x1b[0m. Aborting...`);
				return 0;
			} else {
				log.warn(`Failed to generate source code for \x1b[33m${data.path}\x1b[0m. Skipping this file...`);
				continue;
			}
		}

		let body = "";
		const dataLen = data.targets.length;

		if (config.useGmAssetPath && genPath.includes("objects")) {
			for (const [idx, target] of data.targets.entries()) {
				if (!target.event) {
					body += target.body + "\n";
		
					if (idx < dataLen - 1)
						body += "\n";
				} else {
					const eventFile = normalizePath(resolvePath(`./.out${genPath}/${target.event.fileName}.gml`));
					const objName = eventFile.slice(0, eventFile.lastIndexOf("/"));
					generatedCnt++;
					
					await Bun.write(eventFile, target.body + "\n");

					log.info(`Source code generated for \x1b[34m${target.event.name + (target.event.num ? `\x1b[0m:\x1b[36m${target.event.num}\x1b[34m` : "")} Event\x1b[0m in \x1b[32m${objName}\x1b[0m.`);
				}
			}

			if (body !== "") {
				generatedCnt++;
				await Bun.write(outFile, body);
	
				log.info(`Source code generated for \x1b[34m${outFileSplit.pop()}\x1b[0m in \x1b[32m${outFileSplit.join("/")}\x1b[0m.`);
			} else if (!generatedCnt)
				log.warn(`No source code generated for \x1b[34m${outFileSplit.pop()}\x1b[0m in \x1b[32m${outFileSplit.join("/")}\x1b[0m.`);
		} 
		else {
			for (const [idx, target] of data.targets.entries()) {
				body += target.body + "\n";
	
				if (idx < dataLen - 1)
					body += "\n";
			}

			if (body !== "") {
				generatedCnt++;
				await Bun.write(outFile, body);
	
				log.info(`Source code generated for \x1b[34m${outFileSplit.pop()}\x1b[0m in \x1b[32m${outFileSplit.join("/")}\x1b[0m.`);
			} else 
				log.warn(`No source code generated for \x1b[34m${outFileSplit.pop()}\x1b[0m in \x1b[32m${outFileSplit.join("/")}\x1b[0m.`);
		}
	}

	log.info(`All source code generated. Generated \x1b[32m${generatedCnt}\x1b[0m file(s).`);

	return generatedCnt;
}
