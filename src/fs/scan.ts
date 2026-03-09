import { resolvePath, normalizePath } from "@/utils";
import { readdir, exists } from "node:fs/promises";
import { join, dirname } from "node:path";
import type { VortexConfig, VortexFile } from "@types";

const conf = await getVortexConfig();
const DEFAULT_PATH = resolvePath(conf.production ? "src" : "tests");


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

/**
 * Find the config file from the given path, recursively searching up the directory tree
 * @param filename Name of the config file
 * @returns Path to the config file or `null` if not found
 */
export async function findConfig(filename: string) {
	let dir = process.cwd();

	while (true) {
		const full = join(dir, filename);

		if (await exists(full)) {
			return full;
		}

		const parent = dirname(dir);

		if (parent === dir) {
			return null; 			// reached filesystem root
		}

		dir = parent;
	}
}

/**
 * Get all VortexFiles from the given path
 * @param path Path to scan
 * @returns Array of VortexFile
 */
export async function getVortexFiles(path: string): Promise<VortexFile[]> {
	const files = await readdir(path, { withFileTypes: true, recursive: true });

	return files
		.filter(file => file.isFile() && file.name.endsWith(".gml"))
		.map(file => {
			return {
				name: file.name,
				path: normalizePath(resolvePath(file.parentPath)),
				isVortex: file.name.endsWith(".v.gml"),
				isIndex: file.name === "index.v.gml",
				toGenerate: false,
				content: "",
				childs: []
			};
		});
}

/**
 * Get the Vortex configuration
 * @returns VortexConfig
 */
export async function getVortexConfig(): Promise<VortexConfig> {
	const confPath = await findConfig("vortex.config.ts");

	if (!confPath) return {
		acceptAllIntegration: false,
		noBackup: false,
		noIntegration: false,
		onNotFound: "error",
		production: false,
		tabType: "1t"
	};

	const conf = (await import(confPath)).default;

	return {
		acceptAllIntegration: conf.acceptAllIntegration ?? false,
		noBackup: conf.noBackup ?? false,
		noIntegration: conf.noIntegration ?? false,
		onNotFound: conf.onNotFound ?? "error",
		production: conf.production ?? false,
		tabType: conf.tabType ?? "1t"
	};
}
