import type { ScaffConfig, ScaffFile, ScaffFileGroup } from "@types";
import { fsRuntime } from "@runtime";
import { log } from "@/utils";
import { implRegex, modControlRegex } from "@/parser/regex";
import { parseSpecialValues } from "@/parser/special-value";

/**
 * Group the given files into Scaff files, files to generate, and normal files, and read their contents
 * @param files Array of ScaffFile
 * @returns Object with `scaff`, `generate`, and `normal` properties, each containing an array of files
 */
export async function readAndSplitFiles(files: ScaffFile[], config: ScaffConfig) {
	const res: ScaffFileGroup = {
		generate: [],
		scaff: [],
		normal: []
	};
	
	const intgRegex = /intg (\{[A-Za-z0-9,*\s]+\}|[A-Za-z0-9,*]+) to/;
	const implFiles: ScaffFile[] = [];
	const exports: { file: ScaffFile; depth: number }[] = [];
	const indexes: { file: ScaffFile; depth: number }[] = [];
	const counter = { count: config.counterStart }; 

	for (const file of files) {
		file.content = (await fsRuntime.readText(`${file.path}/${file.name}`)).replace(/\r\n/g, "\n");
		file.toGenerate = intgRegex.test(file.content);
		file.name = file.name.replace(".ss", "");

		if (file.isScaff) {
			const { content: parsedContent, counter: newCounter } = parseSpecialValues(file, counter);
			file.content = parsedContent;
			counter.count = newCounter;
		}

		// set entries (index files) to always be the last files to be processed
		if (file.isIndex) {
			file.name = "";
			indexes.push({ file, depth: file.path.split("/").filter(Boolean).length });
			continue;
		}

		const matchExport = [...file.content.matchAll(modControlRegex)];
		implRegex.lastIndex = 0;

		if (matchExport.length)
			exports.push({ file, depth: file.path.split("/").filter(Boolean).length });
		else if (implRegex.test(file.content)) {
			implRegex.lastIndex = 0;
			const implMatches = [...file.content.matchAll(implRegex)];
			
			if (implMatches.length) {
				for (const match of implMatches) {
					const className = match.groups!.name;
					
					if (className && file.content.includes(`class ${className} {`)) {
						file.childs.push(file);
						res.scaff.push(file);
					} 
					else
						implFiles.push(file);
					
					break;
				}
			}
			else
				implFiles.push(file);
		}
		else if (file.isScaff && file.toGenerate) 
			res.generate.push(file);
		else if (file.isScaff) 
			res.scaff.push(file);
		else 
			res.normal.push(file);
	}
	
	// sort based on depth (number of subdirectories)
	exports.sort((a, b) => b.depth - a.depth);
	indexes.sort((a, b) => b.depth - a.depth);

	for (const fileHandle of exports) {
		implRegex.lastIndex = 0;

		if (implRegex.test(fileHandle.file.content)) 
			implFiles.push(fileHandle.file);
		else if (fileHandle.file.isScaff && fileHandle.file.toGenerate) 
			res.generate.push(fileHandle.file);
		else
			res.scaff.push(fileHandle.file);
	}

	for (const fileHandle of indexes) {
		implRegex.lastIndex = 0;

		if (implRegex.test(fileHandle.file.content))
			implFiles.push(fileHandle.file);
		else if (fileHandle.file.isScaff && fileHandle.file.toGenerate) 
			res.generate.push(fileHandle.file);
		else
			res.scaff.push(fileHandle.file);
	}

	for (const file of implFiles) {
		const classMatch = file.content.match(implRegex);
		if (!classMatch) continue;
		
		const className = classMatch[0].split(" ")[1];

		let classFile = res.scaff.find(f => f.content.includes(`class ${className} {`));
		if (!classFile) 
			classFile = res.generate.find(f => f.content.includes(`class ${className} {`));

		if (classFile) 
			classFile.childs.push(file);
		else {
			if (config.onNotFound === "error") {
				log.error(`Class \x1b[33m${className}\x1b[0m not found for file \x1b[34m${file.name}\x1b[0m. Aborting...`);
				return null;
			}

			log.warn(`Class \x1b[33m${className}\x1b[0m not found for file \x1b[34m${file.name}\x1b[0m. Skipping this file...`);
		}
	}
	
	return res;
}
