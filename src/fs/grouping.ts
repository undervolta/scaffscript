import type { VortexConfig, VortexFile, VortexFileGroup } from "@types";
import { log } from "@/utils";

/**
 * Group the given files into Vortex files, files to generate, and normal files, and read their contents
 * @param files Array of VortexFile
 * @returns Object with `vortex`, `generate`, and `normal` properties, each containing an array of files
 */
export async function readAndSplitFiles(files: VortexFile[], config: VortexConfig) {
	const res: VortexFileGroup = {
		generate: [],
		vortex: [],
		normal: []
	};

	const intgRegex = /intg (\{[A-Za-z0-9,*\s]+\}|[A-Za-z0-9,*]+) to/;
	const implRegex = /impl [A-Za-z0-9]+ {/;
	const implFiles: VortexFile[] = [];

	for (const file of files) {
		const fileHandle = Bun.file(`${file.path}/${file.name}`);

		file.content = (await fileHandle.text()).replace(/\r\n/g, "\n");
		file.toGenerate = intgRegex.test(file.content);

		file.name = file.name.replace(".v.gml", "");
		if (file.isIndex)
			file.name = "";

		if (implRegex.test(file.content))
			implFiles.push(file);
		else if (file.isVortex && file.toGenerate) 
			res.generate.push(file);
		else if (file.isVortex) 
			res.vortex.push(file);
		else 
			res.normal.push(file);
	}

	for (const file of implFiles) {
		const classMatch = file.content.match(implRegex);
		if (!classMatch) continue;
		
		const className = classMatch[0].split(" ")[1];

		let classFile = res.vortex.find(f => f.content.includes(`class ${className} {`));
		if (!classFile) 
			classFile = res.generate.find(f => f.content.includes(`class ${className} {`));

		if (classFile) 
			classFile.childs.push(file);
		else {
			if (config.onNotFound === "error") {
				log.error(`Class \x1b[33m${className}\x1b[0m not found for file ${file.name}. Aborting...`);
				return null;
			}

			log.warn(`Class \x1b[33m${className}\x1b[0m not found for file ${file.name}. Skipping this file...`);
		}
	}

	return res;
}
