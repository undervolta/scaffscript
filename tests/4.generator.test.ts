import { expect, test, describe } from "bun:test";

import { getPath, getScaffFiles, getScaffConfig } from "@/fs";
import { readAndSplitFiles } from "@/fs/grouping";
import {
	getExportedModules, implementClass,
	implementModules, reexportModule
} from "@/parser";

import {
	extractIntegrationData,
	generateSourceCode
} from "@/generator";

import type {
	ScaffModuleUsage,
	ScaffIntegration
} from "@types";

import { normalizePath, resolvePath } from "@/utils";


describe("Source Code Generation", async () => {
	// assume the config and files are valid (from test 1)
	const config = await getScaffConfig();
	const files = await getScaffFiles('tests/scripts');

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

	let intgData: ScaffIntegration[] = [];

	test("Extract integration data", async () => {
		intgData = fileGroup.generate.reduce<ScaffIntegration[]>((acc, file) => {
			const data = extractIntegrationData(file, config);

			if (data)
				acc.push(...data);

			return acc;
		}, []);

		//console.log(`Data to integrate: ${JSON.stringify(intgData, null, 2)}`);

		expect(intgData && intgData.length).toBeTruthy();
	});

	test("Generate source code", async () => {
		if (!intgData) return;

		const genFiles = await generateSourceCode(intgData, config, normalizePath(resolvePath("./tests/ScaffScript/ScaffScript.yyp")));
		console.log(`Generated files: ${JSON.stringify(genFiles, null, 2)}`);

		expect(Object.entries(genFiles).length).toBeGreaterThan(0);
	});
});
