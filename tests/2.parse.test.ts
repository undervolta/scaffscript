import { expect, test, describe } from "bun:test";

import { getPath, getScaffFiles, getScaffConfig } from "@/fs";
import { readAndSplitFiles } from "@/fs/grouping";
import { getExportedModules, implementClass } from "@/parser";
import type { ScaffFile, ScaffFileGroup, ScaffModuleStore } from "@types";


describe("Process Scaff files", async () => {
	// assume the config and files are valid (from test 1)
	const config = await getScaffConfig();
	const files = await getScaffFiles(await getPath());

	let res: ScaffFileGroup | null = null;
	let module: ScaffModuleStore | null = null;

	test("Read and split files", async () => {
		res = await readAndSplitFiles(files, config);

		// res.scaff[1]!.childs[0]!.childs.push(res.scaff[0]!);
		// res.scaff[1]!.childs[0]!.childs.push(res.scaff[0]!);

		// console.log(`Generate files: ${JSON.stringify(res?.generate, null, 2)}`);
		// console.log(`Scaff files: ${JSON.stringify(res?.scaff, null, 2)}`);
		 console.log(`Normal files: ${JSON.stringify(res?.normal, null, 2)}`);

		const nestedChilds: number[] = [];

		const getChildCount = (files: ScaffFile[], isRoot: boolean = false): number => {
			if (!isRoot)
				nestedChilds.push(1);

			const count = files.reduce((acc, file) => acc + getChildCount(file.childs) + 1, 0) - (isRoot ? nestedChilds.length : 0);
			nestedChilds.splice(0, nestedChilds.length);

			return count;
		}

		// console.log(`${getChildCount(res.generate, true)}, ${getChildCount(res.scaff, true)}, ${res.normal.length}`)
		expect(res).toBeDefined();

		if (!res) return;
		
		expect(
			getChildCount(res.generate, true) + 
			getChildCount(res.scaff, true) +
			res.normal.length
		).toBe(files.length /*+ 2*/);
	});

	test("Get modules", () => {
		if (!res) return;

		module = getExportedModules(res, config);

		// console.log(`Module: ${JSON.stringify(module, null, 2)}`);
		expect(res).toBeDefined();
	});

	test("Implement classes", () => {
		if (!res) return;
		if (!module) return;

		const valid = implementClass(module, res, config);

		// console.log(`Module: ${JSON.stringify(module, null, 2)}`);
		// await Bun.write((`.out/testOut.gml`), module["C:/Backup/Project/scaff-gml/tests/scripts/script2"]!["MyClass"]!.parsedStr);

		expect(valid).toBe(true);
	});
});
