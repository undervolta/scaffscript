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


export async function generateSourceCode(intgData: VortexIntegration[], config: VortexConfig): Promise<boolean> {
	await clearOutDir();

	log.info(`Output directory cleared. Generating source code...`);

	for (const data of intgData) {
		if (!data) 
			continue;

		if (!config.noBackup && (await fileExists(data.path)))
			data.backup = await Bun.file(data.path).text();
		
		let genPath = data.path.replace(commonPath([resolvePath("./out"), data.path]) ?? "", "");
		
		if (config.useGmAssetPath && genPath.includes("scripts")) {
			genPath += "/" + data.path.split("scripts")[1];
		}
		
		const outFile = normalizePath(resolvePath(`./.out${genPath}.gml`));
		const outFileSplit = outFile.split("/");

		if (genPath === "") {
			if (config.onNotFound === "error") {
				log.error(`Failed to generate source code for \x1b[33m${data.path}\x1b[0m. Aborting...`);
				return false;
			} else {
				log.warn(`Failed to generate source code for \x1b[33m${data.path}\x1b[0m. Skipping this file...`);
				continue;
			}
		}

		let body = "";
		const dataLen = data.targets.length;
		for (const [idx, target] of data.targets.entries()) {
			body += target.body + "\n";

			if (idx < dataLen - 1)
				body += "\n";
		}

		await Bun.write(outFile, body);

		log.info(`Source code generated for \x1b[34m${outFileSplit.pop()}\x1b[0m in \x1b[32m${outFileSplit.join("/")}\x1b[0m.`);
	}

	log.info(`All source code generated.`);

	return true;
}
