import { expect, test, describe, onTestFinished } from "bun:test";

import { 
	// tabRegex, countSubstring,
	parseHeader,
	getTabLevels,
	modControlRegex,
	contentModRegex,
	contentModShortRegex,
	intgRegex,
	intgBlockRegex
} from "@/parser";

describe("Regex tests", () => {
	test("Implementation regex", () => {
		const input = [
			"impl MyClass {",
			"\tshow_age() {",
			"\t\tshow_debug_message(age);",
			"\t}",
			"",
			"\tset_age(age?) {",
			"\t\tage = age;",
			"\t}",
			"}",
			"",
			"impl MyOtherClass {",
			"\tshow_name(name?) {",
			"\t\tshow_debug_message(name);",
			"\t}",
			"}"
		].join("\n");

		const impl = parseHeader(input);

		expect(impl.length).toBe(2);
		expect(impl[0]?.name).toBe("MyClass");
		expect(impl[0]?.body.trim()).toBe([
			"show_age() {",
			"\t\tshow_debug_message(age);",
			"\t}",
			"",
			"\tset_age(age?) {",
			"\t\tage = age;",
			"\t}"
		].join("\n"));
		expect(impl[1]?.name).toBe("MyOtherClass");
		expect(impl[1]?.body.trim()).toBe([
			"show_name(name?) {",
			"\t\tshow_debug_message(name);",
			"\t}"
		].join("\n"));

		onTestFinished(() => {
			console.log(`Match: ${JSON.stringify(impl, null, 2)}`);
		});
	});

	test("Implementation regex with escaped backslashes", () => {
		const input = [
			"impl MyClass {",
			"\tif (stringCharAt(_this_val, wc_pos - 1) === \"\\\\\") {",
			"\t\treturn true;",
			"\t}",
			"}"
		].join("\n");

		const impl = parseHeader(input);

		//expect(impl.length).toBe(1);
		console.log(`impl: ${impl[0]?.body}`)
	});

	test("Tab regex", () => {
		const input1T = `function test() {
	if (true) {
		show_debug_message("Hello, World!");
	}
}`;
		const input2S = `function test() {
  if (true) {
    show_debug_message("Hello, World!");
  }
}`;
		const input4S = `function test() {
    if (true) {
        show_debug_message("Hello, World!");
    }
}`;

		//const match1T = [...input1T.matchAll(tabRegex.oneTab)].reduce((acc: number[], tabs) => {
		//	acc.push(countSubstring(tabs[0]!, '\t'));
		//	return acc;
		//}, []);

		const match1T = getTabLevels(input1T, "1t");
		const match2S = getTabLevels(input2S, "2s");
		const match4S = getTabLevels(input4S, "4s");

		expect(match1T).toEqual([0, 1, 2, 1, 0]);
		expect(match2S).toEqual([0, 1, 2, 1, 0]);
		expect(match4S).toEqual([0, 1, 2, 1, 0]);

		onTestFinished(() => {
			console.log(`Match 1T: ${match1T}`);
			console.log(`Match 2S: ${match2S}`);
			console.log(`Match 4S: ${match4S}`);
		});
	});

	test("Import regex", () => {
		const input = [
			"import * from \"./script1\"",
			"include { x, y, z } from \"./script2\"",
			"include MyEnum from \"./script3\""
		].join("\n");

		const matches = [...input.matchAll(modControlRegex)];

		for (const [idx, match] of matches.entries()) {
			const { cmd, mod, src, path } = match.groups!;
			
			switch (idx) {
				case 0:
					expect(cmd).toBe("import");
					expect(mod).toBe("*");
					expect(src).toBe("from");
					expect(path).toBe("\"./script1\"");
					break;
				case 1:
					expect(cmd).toBe("include");
					expect(mod).toBe("{ x, y, z }");
					expect(src).toBe("from");
					expect(path).toBe("\"./script2\"");
					break;
				case 2:
					expect(cmd).toBe("include");
					expect(mod).toBe("MyEnum");
					expect(src).toBe("from");
					expect(path).toBe("\"./script3\"");
					break;
			}

			console.log(`Match ${idx}: ${cmd} ${mod} ${src} ${path}`);
		}
	});

	test("Content mod regex", () => {
		const input = [
			"@content MyConst",
			"var abc = @valueof MyVar",
			"type = @typeof MyOtherVar",
			"obj.name = @nameof MyFunc",
			"var def = @:MyVar"
		].join("\n");

		const contentMatches = [...input.matchAll(contentModRegex)];
		const shortMatches = [...input.matchAll(contentModShortRegex)];

		for (const match of contentMatches) {
			const { cmd, mod } = match.groups!;
			console.log(`Content match -> cmd: ${cmd}, mod: ${mod}`);
		}

		for (const match of shortMatches) {
			const { mod } = match.groups!;
			console.log(`Short match -> mod: ${mod}`);
		}
	});

	test("Integration regex", () => {
		const input1 = [
			"intg * to \"./scripts/my_script\"",
			"intg { main, some_mod } to \"./objects/obj_name\"",
			"intg main to \"./scripts/my_script2\""
		].join("\n");

		const input2 = [
			"#[main]",
			"show_debug_message(\"Hello, World!\");",
			"",
			"#[some_mod as abc def]",
			"show_debug_message(\"Hello, World! (some_mod)\");"
		].join("\n");

		const matches = [...input1.matchAll(intgRegex)];
		const blockMatches = [...input2.matchAll(intgBlockRegex)];

		for (const match of matches) {
			const { targets, path } = match.groups!;
			console.log(`Match -> targets: ${targets}, path: ${path}`);
		}

		for (const match of blockMatches) {
			const { name, body } = match.groups!;
			console.log(`Block match -> name: ${name}, body: ${body}`);
		}
	});
});
