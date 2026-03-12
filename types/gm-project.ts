export type GMResourceRef = {
  name: string;
  path: string;
}

export type GMProject = {
	"$GMProject": "v1";
	"%Name": string;
	AudioGroups: {
		"$GMAudioGroup": "v1",
		"%Name": string;
		exportDir: string;
		name: string;
		resourceType: "GMAudioGroup";
		resourceVersion: "2.0";
		targets: number;
	}[];
	configs: {
		children: any[];
		name: string;
	};
	defaultScriptType: number;
	folders: {
		"$GMFolder": string,
		"%Name": string;
		folderPath: string;
		name: string;
		resourceType: "GMFolder";
		resourceVersion: "2.0";
	}[];
	ForcedPrefabProjectReferences: any[];
	IncludedFiles: {
		"$GMIncludedFile": string;
		"%Name": string;
		CopyToMask: number;
		filePath: string;
		name: string;
		resourceType: "GMIncludedFile";
		resourceVersion: "2.0";
	}[];
	isEcma: boolean;
	LibraryEmitters: any[];
	MetaData: {
		IDEVersion: string;
	};
	name: string;
	resources: {
		id: GMResourceRef;
	}[];
	resourceType: "GMProject";
	resourceVersion: "2.0";
	RoomOrderNodes: {
		roomId: GMResourceRef;
	}[];
	templateType: string;
	TextureGroups: {
		"$GMTextureGroup": string;
		"%Name": string;
		autocrop: boolean;
		border: number;
		compressFormat: string;
		customOptions: string;
		directory: string;
		groupParent: any | null;
		isScaled: boolean;
		loadType: string;
		mipsToGenerate: number;
		name: string;
		resourceType: "GMTextureGroup";
		resourceVersion: "2.0";
		targets: number;
	}[];
}

export class GMScript {
	"$GMScript" = "v1";
	"%Name": string;
	isCompatibility = false;
	isDnD = false;
	name: string;
	parent: GMResourceRef;
	resourceType = "GMScript";
	resourceVersion = "2.0";

	constructor(
		name: string,
		dir: string
	) {
		this.name = name;
		this["%Name"] = name;
		this.parent = {
			name: dir,
			path: `folders/${dir}.yy`
		};
	}
}

export class GMObject {
	"$GMObject" = "v1";
	"%Name": string;
	eventList: {
		"$GMEvent": "v1",
		"%Name": string;
		collisionObjectId: any | null;
		eventNum: number;
		eventType: number;
		isDnD: boolean;
		name: string;
		resourceType: "GMEvent";
		resourceVersion: "2.0";
	}[] = [];
	managed: boolean = true;
	name: string;
	overriddenProperties: any[] = [];
	parent: GMResourceRef;
	parentObjectId: any | null = null;
	persistent: boolean = false;
	physicsAngularDamping: number = 0.1;
	physicsDensity: number = 0.5;
	physicsFriction: number = 0.2;
	physicsGroup: number = 1;
	physicsKinematic: boolean = false;
	physicsLinearDamping: number = 0.1;
	physicsObject: boolean = false;
	physicsRestitution: number = 0.1;
	physicsSensor: boolean = false;
	physicsShape: number = 1;
	physicsShapePoints: any[] = [];
	physicsStartAwake: boolean = true;
	properties: any[] = [];
	resourceType = "GMObject";
	resourceVersion = "2.0";
	solid: boolean = false;
	spriteId: any | null = null;
	spriteMaskId: any | null = null;
	visible: boolean = true;

	constructor(
		name: string,
		dir: string
	) {
		this.name = name;
		this["%Name"] = name;
		this.parent = {
			name: dir,
			path: `folders/${dir}.yy`
		};
	}
}
