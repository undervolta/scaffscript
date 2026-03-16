import { expect, test, describe } from "bun:test";

import { getPath, getScaffFiles, getScaffConfig } from "@/fs";
import { readAndSplitFiles } from "@/fs/grouping";
import { 
	getExportedModules, implementClass,
	getModuleUsage, implementModules 
} from "@/parser";

import type { ScaffModuleUsage } from "@types";

describe("Module Implementation", async () => {
	// assume the config and files are valid (from test 1)
	const config = await getScaffConfig();
	const files = await getScaffFiles(await getPath());

	// assume the files already parsed and processed (from test 2)
	const fileGroup = await readAndSplitFiles(files, config);
	if (!fileGroup) return;

	const module = getExportedModules(fileGroup, config);
	const valid = implementClass(module, fileGroup, config);
	if (!valid) return;

	let exportMods: ScaffModuleUsage[] | null = null;

	test.skip("Get used modules", async () => {
		exportMods = await getModuleUsage(module, fileGroup, files.find(f => f.name === "exporter")!, config);
		//console.log(`Mods: ${JSON.stringify(exportMods, null, 2)}`);

		if (!exportMods) return;

		expect(exportMods[0]?.cmd).toBeTruthy();
	});

	test.skip("Module export from other file", async () => {
		const implMods = await implementModules(module, fileGroup, files.find(f => f.name === "exporter")!, config);
		//console.log(`Export Mods: ${JSON.stringify(implMods, null, 2)}`);

		expect(implMods && implMods.length && Object.keys(implMods[0]?.modList!).length).toBeTruthy();
	});

	test.skip("Module import from other file", async () => {
		const implMods = await implementModules(module, fileGroup, files.find(f => f.name === "importer")!, config);
		//console.log(`Module: ${JSON.stringify(module, null, 2)}`);
		//console.log(`Import Mods: ${JSON.stringify(implMods, null, 2)}`);

		expect(implMods && implMods.length && Object.keys(implMods[0]?.modList!).length).toBeTruthy();
	});

	test("Implement modules in all files", async () => {
		const implMods: (ScaffModuleUsage[] | null)[] = []; 

		for (const file of files) {
			const mod = await implementModules(module, fileGroup, file, config);
			implMods.push(mod);
		}
		
		//console.log(`Module: ${JSON.stringify(module, null, 2)}`);
		//console.log(`Impl Mods: ${JSON.stringify(implMods, null, 2)}`);
		console.log(`'Importer' file content: ${files.find(f => f.name === "importer")!.content}`);

		expect(implMods && implMods.length && 
			implMods.every(m => m && (m.length === 0 || (m.length && 
				m.every(mm => mm && mm.cmd))
			))
		).toBeTruthy();
	});
});
