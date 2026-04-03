import type { GMEvent } from "./gm-event";

export type ScaffConfig = {
	acceptAllIntegrations: boolean;						// accept all generated files to be integrated without manual confirmation (default = false)
	clearOutputDir: boolean;							// clear the output directory before generating source code (default = false)
	counterStart: number;								// starting value for the counter special value (default = 1)
	debugLevel: 0 | 1 | 2;								// debug level (default = 0, 0 = no debug, 1 = basic debug, 2 = verbose debug)
	integrationOption: ScaffIntegrationOptions;
	noBackup: boolean;									// don't backup the original files before integration (default = false)
	noIntegration: boolean;								// don't integrate the files to GM project (default = false)
	onNotFound: "error" | "ignore";						// what to do when something is not found (default = "error")
	//outputDir: string;									// output directory for the generated source code (default = "./out")
	path: Record<string, string>;						// path aliases (default = {})
	production: boolean;
	source: string;								// whether the script is running in production mode (default = false)
	tabType: "1t" | "2s" | "4s";						// tab type to use when generating source code (default = "1t")
	targetPlatform: ScaffIntegrationTargetPlatform;	// target platform for the generated code (default = "all"). only used for tree-shaking purpose
	useGmAssetPath: boolean;							// whether to use GM asset path when integrating files (default = false). asset path: `scripts` and `objects`
};

export type ScaffFile = {
	name: string;
	path: string;
	isScaff: boolean;
	isIndex: boolean;
	toGenerate: boolean;
	content: string;
	childs: ScaffFile[]; 	// for files with `impl` statement
};

export type ScaffFileGroup = {
	generate: ScaffFile[],
	scaff: ScaffFile[],
	normal: ScaffFile[]
};

export type ScaffModuleStore = {
	[filePathName: string]: {
		[exportName: string]:		// use `@` prefix for the module usage to avoid conflict with built-in keywords
			| ScaffModuleConst
			| ScaffModuleClass
			| ScaffModuleEnum
			| ScaffModuleFunction
			| ScaffModuleInterface
			| ScaffModuleType
			| ScaffModuleVar
			| ScaffModuleDefault;
	}
}

export type ScaffModuleT = {
	name: string;
	value: string;
	type: string;		// "any" | "string" | "number" | "boolean" | "object" | "method" | "array" | "enum"
};

export type ScaffModuleDefault = {
	type: "unknown";
	parsedStr: string;
} & ScaffModuleT;

export type ScaffModuleConst = {
	type: "constant";
	parsedStr: string;
} & ScaffModuleT;

export type ScaffModuleClass = {
	type: "class";
	declaration: string;
	body: string;
	parsedStr: string;
} & ScaffModuleT;

export type ScaffModuleEnum = {
	type: "enum";
	parsedStr: string;
} & ScaffModuleT;

export type ScaffModuleFunction = {
	type: "function";
	header: string;
	blockValue: string;
	parsedStr: string;
} & ScaffModuleT;

export type ScaffModuleInterface = {
	type: "interface";
	member: {
		[name: string]: {
			type: "any" | "string" | "number" | "boolean" | "object" | "method" | "array" | "enum";
			value: any;
		}
	};
	parsedStr: string;
} & ScaffModuleT;

export type ScaffModuleType = {
	type: "type";
	member: {
		[name: string]: {
			type: "any" | "string" | "number" | "boolean" | "object" | "method" | "array" | "enum";
			value: any;
		}
	};
	parsedStr: string;
} & ScaffModuleT;

export type ScaffModuleVar = {
	type: "variable";
	parsedStr: string;
} & ScaffModuleT;

export type ScaffModuleRetry = {
	filePath: string,
	name: string,
	targetName: string
};

export type ScaffModule = {
	name: string;
	as: string;
	value:
		| ScaffModuleConst
		| ScaffModuleClass
		| ScaffModuleEnum
		| ScaffModuleFunction
		| ScaffModuleInterface
		| ScaffModuleType
		| ScaffModuleVar
		| ScaffModuleDefault;
	usingAlias: boolean;
}

export type ScaffModuleUsage = {
	cmd: "export" | "import" | "include" | null;
	files: (string | ScaffFile)[] | null;
	modList: {
		[moduleAlias: string]: ScaffModule
	} | null;
	targetPath: string | null;
	targetStr: string;
} | null;

export type ScaffIntegrationBlock = {
	name: string;
	body: string;
	path: string | null;
	event: GMEvent | null;
	backup: string | null;
	flags: (keyof ScaffIntegrationBlockFlags)[];
	removeBodies: string[];
};

export type ScaffIntegrationBlockFlags = Partial<{
	debug: true;
	dev: true;
	development: true;
	disabled: true;
	exclude: true;
	prod: true;
	production: true;
	skip: true;
} &
	Record<ScaffIntegrationTargetAllPlatform, true>
>;

export type ScaffIntegrationTargetPlatform =
	| "all"
	| "android"
	| "gxgames"
	| "html5"
	| "ios"
	| "linux"
	| "mac"
	| "ps4"
	| "ps5"
	| "reddit"
	| "switch"
	| "switch2"
	| "tvos"
	| "ubuntu"
	| "windows"
	| "xboxone"
	| "xboxseries"
;

export type ScaffIntegrationTargetPlatformExclusion =
	| "!android"
	| "!gxgames"
	| "!html5"
	| "!ios"
	| "!linux"
	| "!mac"
	| "!ps4"
	| "!ps5"
	| "!reddit"
	| "!switch"
	| "!switch2"
	| "!tvos"
	| "!ubuntu"
	| "!windows"
	| "!xboxone"
	| "!xboxseries"
;

export type ScaffIntegrationTargetAllPlatform =
	| ScaffIntegrationTargetPlatform
	| ScaffIntegrationTargetPlatformExclusion
;

export type ScaffIntegration = {
	path: string;
	targets: ScaffIntegrationBlock[];
	backup: string | null;
	content: {
		[intgPath: string]: string;
	};
} | null;

export type ScaffIntegrationSummary = {
	fullPath: string;			// the full path of generated source code in the './out' directory
	dirPath: string;			// the path to the directory containing the GM resource in the GM IDE
	content: string;
	backup: string | null;
	isNew: boolean;				// whether the .yy file of the GM resource is new
	event: GMEvent | null;
	toRemoves: string[];
};

export type ScaffIntegrationStore = {
	[intgFilePath: string]: ScaffIntegrationSummary;
};

export type ScaffIntegrationOptions = Partial<{
	isDnd: boolean;
}>;
