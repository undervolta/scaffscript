import type {
	VortexConfig,
	VortexIntegrationStore,
	GMProject
} from "@types";

import { fsRuntime } from "@runtime";

import { 
	log, 
	fileExists,
	resolvePath,
	normalizePath
} from "@/utils";

import {
	parseGMJson,
	createGMResourceStr,
	createGMResource,
	removeGMResource,
	modifyYyProject
} from "@/generator";


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
		return null;

	projectPath = normalizePath(resolvePath(projectPath));

	if (!projectPath.endsWith(".yyp")) {
		log.error(`Invalid project path: \x1b[32m${projectPath}\x1b[0m. Aborting...`);
		return null;
	}

	const limit = 10;
	const gmProject = parseGMJson<GMProject>(await fsRuntime.readText(projectPath));
	const projectPathSplit = projectPath.split("/");
	const newFolders: string[] = [];
	const newResources: string[] = [];
	let intgCnt = 0;

	log.info(`Integrating generated source codes to \x1b[34m${projectPathSplit.pop()?.replace(".yyp", "")}\x1b[0m project...`);

	for (let i = 0; i < integrations.length; i += limit) {
		const batch = integrations.slice(i, i + limit);

		await Promise.all(batch.map(async intg => {
			const [path, data] = intg;
			const isExists = await fileExists(path);

			if (isExists) {
				log.info(`Updating \x1b[32m${path}\x1b[0m...`);
			} 
			else {
				log.info(`File \x1b[32m${path}\x1b[0m not found. Creating new resource...`);
				
				const { type, name } = await createGMResource(gmProject, path, data, config.integrationOption);

				if (type && name) {
					newFolders.push(data.dirPath);
					newResources.push(createGMResourceStr(type, name));
					data.isNew = true;
				}
			}

			for (const rmBody of data.toRemoves) {
				data.content = data.content.replace(rmBody, "");
			}
			data.content = data.content.trim() + "\n";

			await fsRuntime.writeText(path, data.content);
			intgCnt++;
		}));
	}

	log.info(`All source codes written. Please click \x1b[1mReload\x1b[0m button in the GameMaker IDE to apply changes.`);
	
	if (newFolders.length > 0 || newResources.length > 0)
		await modifyYyProject("add", projectPath, newResources, newFolders);

	if (!config.acceptAllIntegration) {
		const deleteResources: string[] = [];

		for (const [path, data] of integrations) {
			const pathSlice = path.split("/");

			if (data.backup) {
				const restore = (await fsRuntime.prompt(`---\n\x1b[35m[INPUT]\x1b[0m  Restore file \x1b[34m${pathSlice.pop()}\x1b[0m from \x1b[34m${pathSlice.join("/")}\x1b[0m to the original source code? (y/N) -> `) ?? "n") as "y" | "n";

				if (restore.toLowerCase() === "y") {
					intgCnt--;
					await fsRuntime.writeText(path, data.backup);

					log.info(`File \x1b[34m${path}\x1b[0m restored to the original source code.`);
				}
			} else {
				const fileName = pathSlice.pop()!;
				const remove = (!data.event 
					? (await fsRuntime.prompt(`---\n\x1b[35m[INPUT]\x1b[0m  Remove file \x1b[34m${fileName}\x1b[0m from \x1b[34m${pathSlice.join("/")}\x1b[0m? (y/N) -> `) ?? "n")
					: (await fsRuntime.prompt(`---\n\x1b[35m[INPUT]\x1b[0m  Remove \x1b[34m${data.event.name + (data.event.numStr ? `\x1b[0m:\x1b[36m${data.event.numStr}\x1b[34m` : "")} Event\x1b[0m from \x1b[34m${pathSlice.join("/")}\x1b[0m? (y/N) -> `) ?? "n")
				) as "y" | "n";

				if (remove.toLowerCase() === "y") {
					intgCnt--;
					const { type, name } = await removeGMResource(path, projectPathSplit.join("/"), data);
					
					if (type && name) {
						deleteResources.push(`${type},${name},${data.dirPath}`);
					}

					log.info(`File \x1b[34m${path}\x1b[0m removed from the project.`);
				}
			}
		}

		if (deleteResources.length > 0)
			await modifyYyProject("remove", projectPath, deleteResources);
	}

	log.info(`All source codes integrated successfully. Integrated \x1b[32m${intgCnt}\x1b[0m file(s).`);
	//console.log(`Summaries: ${JSON.stringify(integrations, null, 2)}`);
	
	return intgCnt;
}
