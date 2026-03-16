import { 
	log, 
	fileExists,
	resolvePath,
	normalizePath
} from "@/utils";

import type { CLIResult } from "@types";

/**
 * Parse command line arguments
 * @param args Array of command line arguments
 * @returns Whether the arguments are valid
 */
export async function parseArgs(...args: string[]): Promise<CLIResult | null> {
	console.log("");
	console.log("==========================================================================");
	console.log("Vortex GML - A superset language of GML with TypeScript-like module system");
	console.log("==========================================================================");

	if (!args.length) {
		log.error("No command specified. Add \x1b[32m--help\x1b[0m argument for more information. Aborting...");
		return null;
	}

	const cmd = args[0];

	switch (cmd) {
		case "gen":
		case "generate":
			const path = args[1];
			if (!path) {
				log.error("No source path specified. Please specify a valid source path. Aborting...");
				return null;
			}

			const target = args[2];
			if (target !== "to") {
				log.error(`Invalid target: \x1b[33m${target}\x1b[0m. Please replace it with \x1b[32mto\x1b[0m after the source path argument. Aborting...`);
				return null;
			}

			const yypPath = args[3];
			if (!yypPath) {
				log.error("No project path specified. Please specify a valid project path. Aborting...");
				return null;
			} else if (!yypPath.endsWith(".yyp")) {
				log.error(`Invalid project path: \x1b[33m${yypPath}\x1b[0m. Please specify a valid \x1b[32m.yyp\x1b[0m file. Aborting...`);
				return null;
			}

			const exists = await fileExists(normalizePath(resolvePath(yypPath)));
			if (!exists) {
				log.error(`Project path \x1b[33m${yypPath}\x1b[0m not found. Aborting...`);
				return null;
			}
			
			return {
				cmd: "generate",
				scanPath: normalizePath(resolvePath(path)),
				projectPath: normalizePath(resolvePath(yypPath))
			};
		
		case "help":
		case "-h":
		case "--help":
			console.log(`\x1b[33mvgml \x1b[32m<command> \x1b[34m[args]\x1b[0m`);
			console.log(`\x1b[32m<command>\x1b[0m:  The command to execute.`);
			console.log(`\x1b[34m[args]\x1b[0m:     Optional arguments.`);
			console.log("");
			console.log("Commands:");
			console.log("  gen(erate) <source_path> to <project_path>  Generate source code from the given path to the given project");
			console.log("  help(-h, --help)                            Show this help message");
			console.log("");
			
			return {
				cmd: "help"
			}
		
		default:
			log.error(`Invalid command: \x1b[33m${cmd}\x1b[0m. Aborting...`);
			return null;
	}
}
