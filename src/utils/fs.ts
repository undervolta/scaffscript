import fs from "fs/promises";

/**
 * Clear the output directory
 */
export async function clearOutDir() {
	await fs.rm(".out", { recursive: true, force: true });
}
