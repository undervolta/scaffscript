import type { VortexConfig, VortexFile, VortexFileGroup } from "@types";
import { log } from "@/utils";
import { implRegex, modControlRegex, commentRegex } from "@/parser/regex";

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
	const implFiles: VortexFile[] = [];
	const exports: { file: VortexFile; depth: number }[] = [];
	const indexes: { file: VortexFile; depth: number }[] = [];

	for (const file of files) {
		const fileHandle = Bun.file(`${file.path}/${file.name}`);

		file.content = (await fileHandle.text()).replace(/\r\n/g, "\n");
		file.toGenerate = intgRegex.test(file.content);

		file.name = file.name.replace(".v.gml", "");

		const matchComment = [...file.content.matchAll(commentRegex)];
		for (const match of matchComment) {
			file.content = file.content.replace(match[0]!, "");
		}

		// set entries (index files) to always be the last files to be processed
		if (file.isIndex) {
			file.name = "";
			indexes.push({ file, depth: file.path.split("/").filter(Boolean).length });
			continue;
		}

		const matchExport = [...file.content.matchAll(modControlRegex)];
		
		if (matchExport.length)
			exports.push({ file, depth: file.path.split("/").filter(Boolean).length });
		else if (implRegex.test(file.content)) 
			implFiles.push(file);
		else if (file.isVortex && file.toGenerate) 
			res.generate.push(file);
		else if (file.isVortex) 
			res.vortex.push(file);
		else 
			res.normal.push(file);
	}

	// sort based on depth (number of subdirectories)
	exports.sort((a, b) => b.depth - a.depth);
	indexes.sort((a, b) => b.depth - a.depth);

	for (const fileHandle of exports) {
		if (implRegex.test(fileHandle.file.content))
			implFiles.push(fileHandle.file);
		else if (fileHandle.file.isVortex && fileHandle.file.toGenerate) 
			res.generate.push(fileHandle.file);
		else
			res.vortex.push(fileHandle.file);
	}

	for (const fileHandle of indexes) {
		if (implRegex.test(fileHandle.file.content))
			implFiles.push(fileHandle.file);
		else if (fileHandle.file.isVortex && fileHandle.file.toGenerate) 
			res.generate.push(fileHandle.file);
		else
			res.vortex.push(fileHandle.file);
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
