import { modControlRegex } from "@/parser/regex";
import { resolvePath, normalizePath, log } from "@/utils";
import type { 
	VortexFile,
	VortexModuleStore,
	VortexModule,
	VortexModuleUsage
} from "@types";

/**
 * Get all imported modules from the given file
 * @param module Object with all exported modules
 * @param file File to search in
 * @returns Array of imported modules
 */
export function getModuleUsage(module: VortexModuleStore, file: VortexFile): VortexModuleUsage[] | null {
	const matches = [...file.content.matchAll(modControlRegex)];
	
	return matches.map(match => {
		const { cmd, mod, /*src,*/ path } = match.groups!;
		const res: VortexModuleUsage = {
			cmd: null,
			mods: null,
			//src: null,
			targetPath: null
		};
		
		if (!(cmd && mod /*&& src*/ && path)) {
			log.error(`Invalid module control statement: \x1b[34m${cmd} ${mod} from ${path}\x1b[0m in \x1b[33m${file.name}\x1b[0m from \x1b[32m${file.path}\x1b[0m. Aborting...`);
			return null;
		}
		
		const fromPath = normalizePath(resolvePath(`${file.path}/${path.slice(1, -1)}`));
		const mods: VortexModule[] = [];
		const alias: Record<string, string> = {};

		if (!module[fromPath]) {
			log.error(`Module from \x1b[33m${fromPath}\x1b[0m not found. Aborting...`);
			return null;
		}

		if (mod === '*' || (mod.startsWith('{') && mod.endsWith('}'))) {
			const targetMods = (mod === '*') 
				? null : mod.slice(1, -1).split(',').map(m => {
					const split = m.split(':');
					const key = split[0]!.trim();

					if (split.length === 1)
						alias[key] = key;
					else
						alias[key] = split[1]!.trim();
					
					return key;
				});
			
			Object.entries(module[fromPath])
				.forEach(([key, value]) => {
					if (mod === '*') 
						mods.push({ name: key, as: key, value });
					else if (targetMods!.includes(key)) 
						mods.push({ name: key, as: alias[key] ?? key, value });
				});
		} 
		else {
			if (!module[fromPath][mod]) 
				return res;

			mods.push({ name: mod, as: mod, value: module[fromPath][mod] });
		}

		return {
			cmd: cmd as "export" | "import" | "include", 
			mods, 
			//src, 
			targetPath: normalizePath(resolvePath(path!.slice(1, -1)))
		};
	});
}

export function implementModules(module: VortexModuleStore, file: VortexFile, mods?: VortexModuleUsage[] | null) {
	if (!mods) 
		mods = getModuleUsage(module, file);
	
	if (!mods) 
		return null;

	mods.reduce<Record<string, VortexModule> | null>((acc, mod) => {
		if (!mod || acc === null) 
			return null;

		if (!mod.cmd)
			return null;

		switch (mod.cmd) {
			case "export":	
				const thisPath = file.isIndex ? file.path : `${file.path}/${file.name}`;
				
				if (!module[thisPath]) 
					module[thisPath] = {};

				mod.mods?.forEach(m => module[thisPath]![m.as] = m.value);
				//console.log(`Module from ${thisPath}: ${JSON.stringify(module[thisPath], null, 2)}`);
				break;
		}

		return acc;
	}, {});

	return mods;
}
