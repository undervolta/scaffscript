export type VortexConfig = {
	acceptAllIntegration: boolean;
	noBackup: boolean;
	noIntegration: boolean;
	production: boolean;
};

export type VortexFile = {
	name: string;
	path: string;
	isVortex: boolean;
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
	arrowFn: VortexModuleObject[];
	class: VortexModuleObject[];
	const: VortexModuleObject[];
	enum: VortexModuleObject[];
	interface: VortexModuleObject[];
	let: VortexModuleObject[];
	function: VortexModuleObject[];
	type: VortexModuleObject[];
	var: VortexModuleObject[];
};

export type VortexModuleObject = {
	[name: string]: {
		name: string;		// the header name if it's a function, arrow function, or class
		value: string;
		type: string;		// "any" | "string" | "number" | "boolean" | "object" | "method" | "array" | "enum";
	};
};
