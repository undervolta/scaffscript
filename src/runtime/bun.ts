import type { RuntimeFS } from "./types";

export const BunRuntime: RuntimeFS = {
	async readText(path) {
		return Bun.file(path).text();
	},

	async writeText(path, data) {
		await Bun.write(path, data);
	},

	async delete(path) {
		await Bun.file(path).delete();
	},

	async prompt(message) {
		const input = prompt(message);
		return input?.trim() ?? "";
	}
};
