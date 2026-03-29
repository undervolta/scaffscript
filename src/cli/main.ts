import { parseArgs } from "@/cli";
import { log, resolvePath, deleteDir } from "@/utils";

import { 
	getScaffFiles, 
	getScaffConfig, 
	readAndSplitFiles
} from "@/fs";

import { 
	getExportedModules, implementClass,
	implementModules
} from "@/parser";

import { 
	extractIntegrationData,
	generateSourceCode
} from "@/generator";

import {
	integrateSourceCodes
} from "@/integration";

import type { 
	ScaffModuleUsage,
	ScaffIntegration
} from "@types";


/**
 * Main function
 */
export async function main() {
	const args = process.argv.slice(2);
	const input = await parseArgs(...args);

	if (!input) return;
	
	switch (input.cmd) {
		case "generate":
			// get config and files
			log.debug("Getting Scaff config...");
			const config = await getScaffConfig();
			const files = await getScaffFiles(resolvePath(config.source));

			// process files
			log.debug("Processing files...");
			const fileGroup = await readAndSplitFiles(files, config);
			if (!fileGroup) {
				log.error("Failed to process files. Aborting...");
				return;
			}
			log.debug("Files processed successfully.");

			// get exported modules
			log.debug("Getting exported modules...");
			const module = getExportedModules(fileGroup, config);
			log.debug("Exported modules retrieved successfully.");

			// implement classes
			log.debug("Implementing classes...");
			const implValid = implementClass(module, fileGroup, config);
			if (!implValid) return;
			log.debug("Classes implemented successfully.");

			// implement modules
			log.debug("Implementing modules...");
			const implMods: (ScaffModuleUsage[] | null)[] = []; 
			for (const file of files) {
				const mod = await implementModules(module, fileGroup, file, config);
				implMods.push(mod);
			}

			if (implMods && implMods.length && 
				implMods.every(modUsage => modUsage && (modUsage.length === 0 || (modUsage.length && 
					modUsage.every(mm => mm && mm.cmd))
				))) 
			{
				log.debug("Modules implemented successfully.");
			} 
			else {
				log.error("Failed to implement modules. Aborting...");
				return;
			}

			// extract integration data
			log.debug("Extracting integration data...");
			const intgData = fileGroup.generate.reduce<ScaffIntegration[]>((acc, file) => {
				const data = extractIntegrationData(file, config);

				if (data) 
					acc.push(...data);

				return acc;
			}, []);
			log.debug("Integration data extracted successfully.");

			// generate source code
			const genFiles = await generateSourceCode(intgData, config, input.projectPath);

			// integrate source code
			if (!config.noIntegration && !input.options.noIntegration) {
				log.debug("Integrating source code...");
				const modified = await integrateSourceCodes(genFiles, config, input.projectPath);

				if (modified === null) {
					log.error("Failed to integrate source code. Aborting...");
					return;
				} 
				else if (modified === 0) {
					log.debug("No source code integrated.");
					console.log("---");
					log.info('Program executed successfully. Thanks for using ScaffScript!');
					return;
				} 
				else
					log.info('Program executed successfully. Thanks for using ScaffScript!');
			}
			else {
				console.log("---");

				if (input.options.noIntegration)
					log.info('\x1b[34m--no-integration\x1b[0m option is set. No source code will be integrated. Thanks for using ScaffScript!');
				else
					log.info('\x1b[34mnoIntegration\x1b[0m flag is set to \x1b[33mtrue\x1b[0m in the \x1b[32mscaff.config\x1b[0m. No source code will be integrated. Thanks for using ScaffScript!');
			}

			console.log("");
		break;
	}

	console.log("");
}
