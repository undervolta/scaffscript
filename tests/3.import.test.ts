import { expect, test, describe } from "bun:test";

import { getPath, getVortexFiles, getVortexConfig } from "@/fs";
import { readAndSplitFiles } from "@/fs/grouping";
import { 
	getExportedModules, implementClass,
	getModuleUsage, implementModules 
} from "@/parser";

import type { VortexModuleUsage } from "@types";

describe("Module Implementation", async () => {
	// assume the config and files are valid (from test 1)
	const config = await getVortexConfig();
	const files = await getVortexFiles(getPath());

	// assume the files already parsed and processed (from test 2)
	const res = await readAndSplitFiles(files, config);
	if (!res) return;

	const module = getExportedModules(res, config);
	const valid = implementClass(module, res, config);
	if (!valid) return;

	let exportMods: VortexModuleUsage[] | null = null;

	test("Get used modules", () => {
		exportMods = getModuleUsage(module, files.find(f => f.name === "exporter")!);
		//console.log(`Mods: ${JSON.stringify(exportMods, null, 2)}`);

		if (!exportMods) return;

		expect(exportMods[0]?.cmd).toBeTruthy();
	});

	test("Module export from other file", () => {
		const implMods = implementModules(module, files.find(f => f.name === "exporter")!);
		//console.log(`Export Mods: ${JSON.stringify(implMods, null, 2)}`);

		expect(implMods && implMods.length && implMods[0]?.mods).toBeTruthy();
	});

	test("Module import from other file", () => {
		const implMods = implementModules(module, files.find(f => f.name === "importer")!);
		//console.log(`Module: ${JSON.stringify(module, null, 2)}`);
		console.log(`Import Mods: ${JSON.stringify(implMods, null, 2)}`);

		expect(implMods && implMods.length && implMods[0]?.mods).toBeTruthy();
	});

	test.skip("Include module from other file", () => {
		const implMods = files.map(f => implementModules(module, f));
		//console.log(`Module: ${JSON.stringify(module, null, 2)}`);
		console.log(`Impl Mods: ${JSON.stringify(implMods, null, 2)}`);

		expect(implMods && implMods.length && 
			implMods.every(m => m && (m.length === 0 || (m.length && 
				m.every(mm => mm && mm.cmd))
			))
		).toBeTruthy();
	});
});
