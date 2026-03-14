import { resolvePath, normalizePath, log } from "@/utils";
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
	return normalizePath(resolvePath(
		process.argv[2] ?? 
		prompt(`\x1b[35m[INPUT]\x1b[0m  Scan path (default: ${DEFAULT_PATH}): `) ?? 
		DEFAULT_PATH
	));
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
	log.info(`Scanning for \x1b[34m.v.gml\x1b[0m and \x1b[34m.gml\x1b[0m files in \x1b[32m${path}\x1b[0m...`);
	const files = await readdir(path, { withFileTypes: true, recursive: true });

	const vFiles = files
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

	log.info(`Found \x1b[32m${vFiles.filter(file => file.isVortex).length} \x1b[34m.v.gml\x1b[0m file(s) and \x1b[32m${vFiles.filter(file => !file.isVortex).length}\x1b[0m \x1b[34m.gml\x1b[0m file(s).`);

	return vFiles;
}

/**
 * Get the Vortex configuration
 * @returns VortexConfig
 */
export async function getVortexConfig(): Promise<VortexConfig> {
	const confPath = await findConfig("vortex.config.ts");

	if (!confPath) return {
		acceptAllIntegration: false,
		debugLevel: 0,
		integrationOption: {},
		noBackup: false,
		noIntegration: false,
		onNotFound: "error",
		path: {},
		production: false,
		tabType: "1t",
		useGmAssetPath: false
	};

	const conf = (await import(confPath)).default;

	return {
		acceptAllIntegration: conf.acceptAllIntegration ?? false,
		debugLevel: conf.debugLevel ?? 0,
		integrationOption: conf.integrationOption ?? {},
		noBackup: conf.noBackup ?? false,
		noIntegration: conf.noIntegration ?? false,
		onNotFound: conf.onNotFound ?? "error",
		path: conf.path ?? {},
		production: conf.production ?? false,
		tabType: conf.tabType ?? "1t",
		useGmAssetPath: conf.useGmAssetPath ?? false
	};
}
