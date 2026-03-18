import { spawn } from "child_process";
import { cp } from "fs/promises";
import { log } from "@/utils";
import type { CloneOptions } from "@types";


/**
 * Clone a template from a repository
 * @param options Clone options
 * @returns Promise that resolves when the template is cloned
 */
export function cloneTemplate({
	repo,
	template,
	targetDir,
	rootDir = "templates"
}: CloneOptions): Promise<void> {
	return new Promise((resolve) => {
		const templatePath = `${rootDir}/${template}/.temp`;

		const git = spawn("git", [
			"clone",
			"--depth=1",
			"--filter=blob:none",
			"--sparse",
			repo,
			targetDir,
		], {
			stdio: "inherit",
		});

		git.on("close", (code) => {
			if (code !== 0) {
				log.error(`Failed to clone template \x1b[33m${template}\x1b[0m: ${code}`);
				return;
			}

			// enable sparse checkout
			const sparse = spawn("git", [
				"sparse-checkout",
				"set",
				templatePath,
			], {
				cwd: targetDir,
				stdio: "inherit",
			});

			sparse.on("close", (code) => {
				if (code !== 0) {
					log.error(`Failed to enable sparse checkout for template \x1b[33m${template}\x1b[0m: ${code}`);
					return;
				}

				resolve();
			});
		});
	});
}

/**
 * Flatten a template to a target directory
 * @param sourceDir Source directory
 * @param targetDir Target directory
 * @returns Promise that resolves when the template is flattened
 */
export async function flattenTemplate(sourceDir: string, targetDir: string): Promise<boolean> {
	try {
		await cp(sourceDir, targetDir, {
			recursive: true,
			force: true,
			errorOnExist: false
		});

		return true;
	} catch (error) {
		log.error(`Failed to flatten template: ${error}`);
		return false;
	}
}
