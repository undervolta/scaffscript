import type { GMEvent } from "./gm-event";

export type VortexConfig = {
	acceptAllIntegration: boolean;		// accept all generated files to be integrated without manual confirmation (default = false)
	debugLevel: 0 | 1 | 2;				// debug level (default = 0, 0 = no debug, 1 = basic debug, 2 = verbose debug)
	noBackup: boolean;					// don't backup the original files before integration (default = false)
	noIntegration: boolean;				// don't integrate the files to GM project (default = false)
	onNotFound: "error" | "ignore";		// what to do when something is not found (default = "error")
	path: Record<string, string>;		// path aliases (default = {})
	production: boolean;				// whether the script is running in production mode (default = false)
	tabType: "1t" | "2s" | "4s";		// tab type to use when generating source code (default = "1t")
	useGmAssetPath: boolean;			// whether to use GM asset path when integrating files (default = false). asset path: `scripts` and `objects`
};

export type VortexFile = {
	name: string;
	path: string;
	isVortex: boolean;
	isIndex: boolean;
	toGenerate: boolean;
	content: string;
	childs: VortexFile[]; 	// for files with `impl` statement
};

export type VortexFileGroup = {
	generate: VortexFile[],
	vortex: VortexFile[],
	normal: VortexFile[]
};

export type VortexModuleStore = {
	[filePathName: string]: {
		[exportName: string]:		// use `@` prefix for the module usage to avoid conflict with built-in keywords
			| VortexModuleConst
			| VortexModuleFunction
			| VortexModuleInterface
			| VortexModuleType
			| VortexModuleVar
			| VortexModuleDefault;
	}
}

export type VortexModuleT = {
	name: string;
	value: string;
	type: string;		// "any" | "string" | "number" | "boolean" | "object" | "method" | "array" | "enum"
};

export type VortexModuleDefault = {
	parsedStr: string;
} & VortexModuleT;

export type VortexModuleConst = {
	parsedStr: string;
} & VortexModuleT;

export type VortexModuleFunction = {
	header: string;
	blockValue: string;
	parsedStr: string;
} & VortexModuleT;

export type VortexModuleInterface = {
	member: {
		[name: string]: {
			type: "any" | "string" | "number" | "boolean" | "object" | "method" | "array" | "enum";
			value: any;
		}
	};
	parsedStr: string;
} & VortexModuleT;

export type VortexModuleType = {
	member: {
		[name: string]: {
			type: "any" | "string" | "number" | "boolean" | "object" | "method" | "array" | "enum";
			value: any;
		}
	};
	parsedStr: string;
} & VortexModuleT;

export type VortexModuleVar = {
	parsedStr: string;
} & VortexModuleT;

export type VortexModuleRetry = { 
	filePath: string, 
	name: string, 
	targetName: string
};

export type VortexModule = {
	name: string;
	as: string; 
	value: 
		| VortexModuleConst
		| VortexModuleFunction
		| VortexModuleInterface
		| VortexModuleType
		| VortexModuleVar
		| VortexModuleDefault;
	usingAlias: boolean;
}

export type VortexModuleUsage = {
	cmd: "export" | "import" | "include" | null;
	files: (string | VortexFile)[] | null;
	modList: {
		[moduleAlias: string]: VortexModule
	} | null;
	targetPath: string | null;
	targetStr: string;
} | null;

export type VortexIntegrationBlock = {
	name: string;
	body: string;
	event: GMEvent | null;
};

export type VortexIntegration = {
	path: string;
	targets: VortexIntegrationBlock[];
	backup: string | null;
} | null;
