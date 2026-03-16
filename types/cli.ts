export type CLIResult = 
	| { cmd: "generate"; scanPath: string; projectPath: string }
	| { cmd: "help" }
	| null
;
