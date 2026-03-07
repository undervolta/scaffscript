import { resolvePath, log } from "../utils";

const DEFAULT_PATH = resolvePath("src");

/**
 * Get the path to scan from command line arguments or prompt
 * @returns Absolute path to scan
 */
export function getPath() {
	return resolvePath(
		process.argv[2] ?? 
		prompt(`Path (default: ${DEFAULT_PATH}): `) ?? 
		DEFAULT_PATH
	);
}

