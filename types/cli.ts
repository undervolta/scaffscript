export type CLIResult = 
	| { cmd: "generate"; scanPath: string; projectPath: string; }
	| { cmd: "help"; }
	| { cmd: "init"; targetPath: string; template: TemplateType; initGit: boolean; isNew: boolean; }
	| null
;

export type CloneOptions = {
	repo: string;
	template: TemplateType;
	targetDir: string;
	rootDir?: string;
}

export type TemplateType = "bun" | "pnpm" | "npm";
