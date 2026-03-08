export type VortexConfig = {
	acceptAllIntegration: boolean;
	noBackup: boolean;
	noIntegration: boolean;
	onNotFound: "error" | "ignore";
	production: boolean;
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

export type VortexModule = {
	[filePathName: string]: {
		[exportName: string]:
			| VortexModuleConst
			| VortexModuleFunction
			| VortexModuleInterface
			| VortexModuleType
			| VortexModuleVar
			| VortexModuleDefault;
	}
}

/*export type VortexModule = {
	arrowFn: VortexModuleFunction[];
	class: VortexModuleTDefault[];
	const: VortexModuleConst;
	enum: VortexModuleTDefault[];
	interface: VortexModuleTDefault[];
	let: VortexModuleTDefault;
	function: VortexModuleTDefault[];
	type: VortexModuleTDefault[];
	var: VortexModuleTDefault;
};*/

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
