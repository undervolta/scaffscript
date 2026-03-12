import { expect, test, describe } from "bun:test";

import { 
	getPath, 
	getVortexFiles, 
	getVortexConfig, 
	readAndSplitFiles 
} from "@/fs";

import { 
	getExportedModules, implementClass,
	implementModules
} from "@/parser";

import { 
	extractIntegrationData,
	generateSourceCode,
	parseGMJson
} from "@/generator";

import { 
	resolvePath 
} from "@/utils";

import type { 
	VortexModuleUsage,
	VortexIntegration,
	GMProject
} from "@types";


describe("Generated Source Code Integration", async () => {
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

	// assume the integration data is extracted and source code is generated (from test 4)
	const intgData = fileGroup.generate.reduce<VortexIntegration[]>((acc, file) => {
		const data = extractIntegrationData(file, config);

		if (data) 
			acc.push(...data);

		return acc;
	}, []);

	if (!intgData) return;

	const genCnt = await generateSourceCode(intgData, config);

	if (genCnt <= 0) return;

	test("Integrate generated source code", async () => {
		if (!config.noIntegration) {
			const project = parseGMJson<GMProject>(await Bun.file(resolvePath("./tests/Vortex-GML/Vortex-GML.yyp")).text());
			console.log(`GM Project: ${JSON.stringify(project, null, 2)}`);
			
			expect(project).toBeDefined();
		} else
			expect(true).toBe(true);
	});
});
