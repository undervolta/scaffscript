export type CLIResult = 
	| { cmd: "generate"; 
		options: Partial<{
			integrate: boolean;		// force integrate the generated source code
			noIntegration: boolean;	// force not to integrate the generated source code
		}>;
		projectPath: string; }
	| { cmd: "help"; }
	| null
;

export type CloneOptions = {
	repo: string;
	template: TemplateType;
	targetDir: string;
	rootDir?: string;
}

export type TemplateType = "bun" | "pnpm" | "npm";
