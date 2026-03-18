import { resolvePath, normalizePath, log, fileExists } from "@/utils";
import { readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import type { ScaffConfig, ScaffFile } from "@types";
import { fsRuntime } from "@runtime";

//const conf = await getScaffConfig();
//const DEFAULT_PATH = resolvePath(conf.production ? "src" : "tests");
const DEFAULT_PATH = resolvePath("src");

const CONFIG_FILES = [
	"scaff.config.ts",
	"scaff.config.mjs",
	"scaff.config.js",
	"scaff.config.cjs",
	"scaff.config.json",
];


/**
 * Get the path to scan from command line arguments or prompt
 * @param path Path override
 * @returns Absolute path to scan
 */
export async function getPath(path?: string) {
	return path ?? normalizePath(resolvePath(
		process.argv[2] ?? 
		await fsRuntime.prompt(`\x1b[35m[INPUT]\x1b[0m  Scan path (default: ${DEFAULT_PATH}): `) ?? 
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

		if (await fileExists(full)) {
			return full;
		}

		const parent = dirname(dir);

		if (parent === dir) {
			return null; 		// reached filesystem root
		}

		dir = parent;
	}
}

/**
 * Get all ScaffFiles from the given path
 * @param path Path to scan
 * @returns Array of ScaffFile
 */
export async function getScaffFiles(path: string): Promise<ScaffFile[]> {
	log.debug(`Scanning for \x1b[34m*.ss\x1b[0m and \x1b[34m*.gml\x1b[0m files in \x1b[32m${path}\x1b[0m...`);
	const files = await readdir(path, { withFileTypes: true, recursive: true });

	const vFiles = files
		.filter(file => file.isFile() && (file.name.endsWith(".ss") || file.name.endsWith(".gml")))
		.map(file => {
			return {
				name: file.name,
				path: normalizePath(resolvePath(file.parentPath)),
				isScaff: file.name.endsWith(".ss"),
				isIndex: file.name === "index.ss",
				toGenerate: false,
				content: "",
				childs: []
			};
		});

	log.info(`Found \x1b[32m${vFiles.filter(file => file.isScaff).length} \x1b[34m*.ss\x1b[0m file(s) and \x1b[32m${vFiles.filter(file => !file.isScaff).length}\x1b[0m \x1b[34m*.gml\x1b[0m file(s).`);

	return vFiles;
}

/**
 * Get the Scaff configuration
 * @returns ScaffConfig
 */
export async function getScaffConfig(): Promise<ScaffConfig> {
	let confPath: string | null = null;

	// search config files
	for (const name of CONFIG_FILES) {
		confPath = await findConfig(name);

		if (confPath) break;
	}

	let conf: Partial<ScaffConfig> = {};

	// load file config
	if (confPath) {
		const ext = confPath.split(".").pop();

		if (ext === "cjs" || ext === "json") {
			conf = require(confPath);
		} else {
			const mod = await import(pathToFileURL(confPath).href);
			conf = mod.default ?? mod;
		}
	}

	// fallback to package.json config
	if (!confPath) {
		const pkgPath = await findConfig("package.json");

		if (pkgPath) {
			try {
				const raw = await fsRuntime.readText(pkgPath);
				const pkg = JSON.parse(raw);

				if (pkg.scaff) {
					conf = pkg.scaff;
				}
			} catch {
				// ignore invalid package.json
			}
		}
	}

	return {
		acceptAllIntegrations: conf.acceptAllIntegrations ?? false,
		clearOutputDir: conf.clearOutputDir ?? false,
		counterStart: conf.counterStart ?? 1,
		debugLevel: conf.debugLevel ?? 0,
		integrationOption: conf.integrationOption ?? {},
		noBackup: conf.noBackup ?? false,
		noIntegration: conf.noIntegration ?? false,
		onNotFound: conf.onNotFound ?? "error",
		path: conf.path ?? {},
		production: conf.production ?? false,
		tabType: conf.tabType ?? "1t",
		targetPlatform: conf.targetPlatform ?? "all",
		useGmAssetPath: conf.useGmAssetPath ?? false
	};
}
