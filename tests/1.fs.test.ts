import { expect, test, describe } from "bun:test";

import { getPath, getScaffFiles } from "@/fs";
//import { resolvePath } from "@utils";


describe("Scan and get Scaff files", async () => {
	test.skip("Get path", async () => {
		const path = getPath();

		expect(path).toBeDefined();
	});
	
	test("Get Scaff files", async () => {
		const vFiles = await getScaffFiles(await getPath());

		console.log(`${JSON.stringify(vFiles, null, 2)}`)
	
		expect(vFiles.length).toBeGreaterThan(0);
	});
});
