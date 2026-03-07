import { expect, test, describe } from "bun:test";

import { getPath, getVortexFiles } from "@/fs";
//import { resolvePath } from "@utils";


describe("Scan and get Vortex files", async () => {
	test.skip("Get path", async () => {
		const path = getPath();

		expect(path).toBeDefined();
	});
	
	test("Get Vortex files", async () => {
		const vFiles = await getVortexFiles(getPath());

		console.log(`${JSON.stringify(vFiles, null, 2)}`)
	
		expect(vFiles.length).toBeGreaterThan(0);
	});
});
