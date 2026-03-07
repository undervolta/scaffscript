import { expect, test, describe } from "bun:test";

import { getPath, getVortexFiles } from "@/fs";
import { readAndSplitFiles } from "@/fs/grouping";
import { getExportedModules } from "@/parser/exporter";
import type { VortexFile } from "@types";


describe("Transform Vortex files", async () => {
	test("Read and split files", async () => {
		const files = await getVortexFiles(getPath());
		const res = await readAndSplitFiles(files);

		// res.vortex[1]!.childs[0]!.childs.push(res.vortex[0]!);
		// res.vortex[1]!.childs[0]!.childs.push(res.vortex[0]!);

		// console.log(`Generate files: ${JSON.stringify(res.generate, null, 2)}`);
		// console.log(`Vortex files: ${JSON.stringify(res.vortex, null, 2)}`);
		// console.log(`Normal files: ${JSON.stringify(res.normal, null, 2)}`);

		const nestedChilds: number[] = [];

		const getChildCount = (files: VortexFile[], isRoot: boolean = false): number => {
			if (!isRoot)
				nestedChilds.push(1);

			const count = files.reduce((acc, file) => acc + getChildCount(file.childs) + 1, 0) - (isRoot ? nestedChilds.length : 0);
			nestedChilds.splice(0, nestedChilds.length);

			return count;
		}

		//console.log(`${getChildCount(res.generate, true)}, ${getChildCount(res.vortex, true)}, ${res.normal.length}`)
		
		expect(
			getChildCount(res.generate, true) + 
			getChildCount(res.vortex, true) +
			res.normal.length
		).toBe(files.length /*+ 2*/);

		const module = getExportedModules(res);
		console.log(`Module: ${JSON.stringify(module, null, 2)}`);
	});
});
