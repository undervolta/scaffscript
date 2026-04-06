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
	console.log("===========================================================================");
	console.log("ScaffScript - A superset language of GML with TypeScript-like module system");
	console.log("===========================================================================");

	if (!args.length) {
		log.error("No command specified. Add \x1b[32m--help\x1b[0m argument for more information. Aborting...");
		return null;
	}

	const cmd = args[0];

	switch (cmd) {
		case "gen":
		case "generate":
			const yypPath = args[1];
			if (!yypPath) {
				log.error("No project path specified. Please specify a valid project path. Aborting...");
				return null;
			} else if (!yypPath.endsWith(".yyp")) {
				log.error(`Invalid project path: \x1b[33m${yypPath}\x1b[0m. Please specify a valid \x1b[32m.yyp\x1b[0m file. Aborting...`);
				return null;
			}

			const optionList = [...args].slice(2);
			const options = {
				integrate: optionList.includes("-i") || optionList.includes("--integrate"),
				noIntegration: optionList.includes("-!i") || optionList.includes("--no-integration")
			}
			
			if (options.integrate && options.noIntegration) {
				log.error("Cannot specify both \x1b[33m--integrate\x1b[0m and \x1b[33m--no-integration\x1b[0m. Aborting...");
				return null;
			}

			const exists = await fileExists(normalizePath(resolvePath(yypPath)));
			if (!exists) {
				log.error(`Project path \x1b[33m${yypPath}\x1b[0m not found. Aborting...`);
				return null;
			}
			
			return {
				cmd: "generate",
				options,
				projectPath: normalizePath(resolvePath(yypPath))
			};
		
		case "help":
		case "-h":
		case "--help":
			console.log(`\x1b[33mscaff \x1b[32m<command> \x1b[34m[args]\x1b[0m`);
			console.log(`\x1b[32m<command>\x1b[0m:  The command to execute.`);
			console.log(`\x1b[34m[args]\x1b[0m:     Optional arguments.`);
			console.log("");
			console.log("Commands:");
			console.log("  generate <project_path>      		Generate source code from the given path to the given project");
			console.log("    aliases: gen");
			console.log("    example: generate ./my-game.yyp");
			console.log("  help                                 Show this help message");
			console.log("    aliases: -h, --help");
			console.log("");
			
			return {
				cmd: "help"
			}

		default:
			log.error(`Invalid command: \x1b[33m${cmd}\x1b[0m. Aborting...`);
			return null;
	}
}
