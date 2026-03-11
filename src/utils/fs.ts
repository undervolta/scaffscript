import fs from "fs/promises";

/**
 * Clear the output directory
 */
export async function clearOutDir() {
	await fs.rm(".out", { recursive: true, force: true });
}

/**
 * Check if the file exists
 * @param path Path to the file
 * @returns Whether the file exists
 */
export async function fileExists(path: string): Promise<boolean> {
	try {
		await fs.access(path, fs.constants.F_OK);
		return true;
	} catch {
		return false;
	}
}
