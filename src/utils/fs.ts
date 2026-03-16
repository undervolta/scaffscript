import fs from "fs/promises";
import { constants } from "fs";
import { log, resolvePath, relativePath, isAbsolute } from "@utils";


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
	if (typeof Bun !== "undefined") {
		return Bun.file(path).exists();
	}

	try {
		await fs.access(path, constants.R_OK);
		return true;
	} catch {
		return false;
	}
}

/**
 * Delete the directory
 * @param path Path to the directory
 * @param root Root path of the directory
 */
export async function deleteDir(target: string, root: string) {
	const resolvedTarget = resolvePath(target);
	const resolvedRoot = resolvePath(root);

	const rel = relativePath(resolvedTarget, resolvedRoot);

	if (!rel || rel === ".") {
		log.error(`Failed to delete directory \x1b[32m${resolvedTarget}\x1b[0m: Cannot delete root directory.`);
		return;
	}
	else if (resolvedTarget === resolvedRoot) {
		log.error(`Failed to delete directory \x1b[32m${resolvedTarget}\x1b[0m: Cannot delete root directory.`);
		return;
	}
	else if (rel.startsWith("..") || isAbsolute(rel)) {
		log.error(`Failed to delete directory \x1b[32m${resolvedTarget}\x1b[0m: Outside root \x1b[32m${resolvedRoot}\x1b[0m.`);
		return;
	}

	await fs.rm(resolvedTarget, { recursive: true, force: true });
}

