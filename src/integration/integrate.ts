import type {
	VortexConfig,
	VortexIntegrationStore,
	GMProject
} from "@types";

import { 
	log, 
	fileExists,
	resolvePath,
	normalizePath
} from "@/utils";

import {
	parseGMJson,
	createGMResource
} from "@/generator";

import {
	removeGMResource
} from "./gm-asset";


/**
 * Integrate generated source code to GameMaker project
 * @param genFile Array of integration data
 * @param config Vortex config
 * @param projectPath Path to the GM project
 * @returns Number of files integrated successfully
 */
export async function integrateSourceCodes(genFile: VortexIntegrationStore, config: VortexConfig, projectPath: string) {
	const integrations = Object.entries(genFile);

	if (integrations.length <= 0) 
		return 0;

	projectPath = normalizePath(resolvePath(projectPath));

	const limit = 10;
	const gmProject = parseGMJson<GMProject>(await Bun.file(projectPath).text());
	let intgCnt = 0;

	log.info(`Integrating generated source codes to \x1b[34m${projectPath.split("/").pop()?.replace(".yyp", "")}\x1b[0m project...`);

	for (let i = 0; i < integrations.length; i += limit) {
		const batch = integrations.slice(i, i + limit);

		await Promise.all(batch.map(async intg => {
			const [path, data] = intg;
			const isExists = await fileExists(path);

			if (isExists) {
				log.info(`Updating \x1b[32m${path}\x1b[0m...`);
				await Bun.write(path, data.content);
			} 
			else {
				log.info(`File \x1b[32m${path}\x1b[0m not found. Creating new resource...`);
				//await createGMResource(gmProject, path, data.content);
			}
			intgCnt++;
		}));
	}

	if (!config.acceptAllIntegration) {
		for (const [path, data] of integrations) {
			const pathSlice = path.split("/");

			if (data.backup) {
				const restore = (prompt(`---\n\x1b[35m[INPUT]\x1b[0m  Restore file \x1b[34m${pathSlice.pop()}\x1b[0m from \x1b[34m${pathSlice.join("/")}\x1b[0m to the original source code? (y/N) -> `) ?? "n") as "y" | "n";

				if (restore.toLowerCase() === "y") {
					intgCnt--;
					await Bun.write(path, data.backup);
					log.info(`File \x1b[34m${path}\x1b[0m restored to the original source code.`);
				}
			} else {
				const fileName = pathSlice.pop()!;
				const remove = (!data.event 
					? (prompt(`---\n\x1b[35m[INPUT]\x1b[0m  Remove file \x1b[34m${fileName}\x1b[0m from \x1b[34m${pathSlice.join("/")}\x1b[0m? (y/N) -> `) ?? "n")
					: (prompt(`---\n\x1b[35m[INPUT]\x1b[0m  Remove \x1b[34m${data.event.name + (data.event.num ? `\x1b[0m:\x1b[36m${data.event.num}\x1b[34m` : "")} Event\x1b[0m from \x1b[34m${pathSlice.join("/")}\x1b[0m? (y/N) -> `) ?? "n")
				) as "y" | "n";

				if (remove.toLowerCase() === "y") {
					intgCnt--;
					await removeGMResource(gmProject, path);
					log.info(`File \x1b[34m${path}\x1b[0m removed from the project.`);
				}
			}
		}
	}

	log.info(`All source codes integrated successfully. Integrated \x1b[32m${intgCnt}\x1b[0m file(s).`);

	return intgCnt;
}
