import { expect, test, describe } from "bun:test";

import {
	getPath,
	getScaffFiles,
	getScaffConfig,
	readAndSplitFiles
} from "@/fs";

import {
	getExportedModules, implementClass,
	implementModules, reexportModule
} from "@/parser";

import {
	extractIntegrationData,
	generateSourceCode
} from "@/generator";

import {
	integrateSourceCodes
} from "@/integration";

import {
	resolvePath,
	normalizePath
} from "@/utils";

import type {
	ScaffModuleUsage,
	ScaffIntegration
} from "@types";


describe("Generated Source Code Integration", async () => {
	// assume the config and files are valid (from test 1)
	const config = await getScaffConfig();
	const scanPath = 'tests/scripts';			 //await getPath();
	const projectPath = resolvePath("./tests/ScaffScript/ScaffScript.yyp");		//resolvePath('../test-cli/My Game.yyp');
	const files = await getScaffFiles(scanPath);

	// assume the files already parsed and processed (from test 2)
	const fileGroup = await readAndSplitFiles(files, config);
	if (!fileGroup) return;

	const module = getExportedModules(fileGroup, config);
	const valid = implementClass(module, fileGroup, config);
	if (!valid) return;

	// assume the modules are implemented (from test 3)
	for (const file of files) {
		reexportModule(module, file, config);
	}

	const implMods: (ScaffModuleUsage[] | null)[] = [];
	for (const file of files) {
		const mod = await implementModules(module, fileGroup, file, config);
		implMods.push(mod);
	}

	if (!implMods) return;

	// assume the integration data is extracted and source code is generated (from test 4)
	const intgData = fileGroup.generate.reduce<ScaffIntegration[]>((acc, file) => {
		const data = extractIntegrationData(file, config);

		if (data)
			acc.push(...data);

		return acc;
	}, []);

	if (!intgData) return;

	const genFiles = await generateSourceCode(intgData, config, normalizePath(projectPath));

	if (Object.entries(genFiles).length <= 0) return;

	test("Integrate generated source code", async () => {
		if (!config.noIntegration) {
			const modified = await integrateSourceCodes(genFiles, config, projectPath);

			expect(modified !== null).toBe(true);

			//const project = parseGMJson<GMProject>(await Bun.file(projectPath).text());
			//console.log(`GM Project: ${JSON.stringify(project, null, 2)}`);

			//expect(project).toBeDefined();
		} else {
			console.log("No integration performed.");
			expect(true).toBe(true);
		}
	}, 60000);
});
