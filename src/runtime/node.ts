import type { RuntimeFS } from "./types";

let fs: typeof import("fs/promises");
let readline: typeof import("readline/promises");

async function ensureModules() {
	if (!fs) 
		fs = await import("fs/promises");

	if (!readline) 
		readline = await import("readline/promises");
}

export const NodeRuntime: RuntimeFS = {
	async readText(path) {
		await ensureModules();
		return fs.readFile(path, "utf8");
	},

	async writeText(path, data) {
		await ensureModules();

		const { dirname } = await import("node:path");
    	await fs.mkdir(dirname(path), { recursive: true });
		
		await fs.writeFile(path, data, "utf8");
	},

	async delete(path) {
		await ensureModules();
		await fs.unlink(path);
	},

	async prompt(message) {
		await ensureModules();

		const { stdin, stdout } = await import("process");

		const rl = readline.createInterface({
			input: stdin,
			output: stdout
		});

		const answer = await rl.question(message + " ");
		rl.close();

		return answer.trim();
	}
};
