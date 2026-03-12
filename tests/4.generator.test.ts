import { expect, test, describe } from "bun:test";

import { getPath, getVortexFiles, getVortexConfig } from "@/fs";
import { readAndSplitFiles } from "@/fs/grouping";
import { 
	getExportedModules, implementClass,
	implementModules
} from "@/parser";

import { 
	extractIntegrationData,
	generateSourceCode
} from "@/generator";

import type { 
	VortexModuleUsage,
	VortexIntegration
} from "@types";


describe("Source Code Generation", async () => {
	// assume the config and files are valid (from test 1)
	const config = await getVortexConfig();
	const files = await getVortexFiles(getPath());

	// assume the files already parsed and processed (from test 2)
	const fileGroup = await readAndSplitFiles(files, config);
	if (!fileGroup) return;

	const module = getExportedModules(fileGroup, config);
	const valid = implementClass(module, fileGroup, config);
	if (!valid) return;

	// assume the modules are implemented (from test 3)
	const implMods: (VortexModuleUsage[] | null)[] = []; 
	for (const file of files) {
		const mod = await implementModules(module, fileGroup, file, config);
		implMods.push(mod);
	}

	if (!implMods) return;

	let intgData: VortexIntegration[] = [];

	test("Extract integration data", async () => {
		intgData = fileGroup.generate.reduce<VortexIntegration[]>((acc, file) => {
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
		
		const genCnt = await generateSourceCode(intgData, config);

		expect(genCnt).toBeGreaterThan(0);
	});
});
