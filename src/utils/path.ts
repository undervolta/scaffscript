import path from "path";

export function resolvePath(p: string): string {
	return path.resolve(p);
}

export function normalizePath(p: string): string {
	return p.replace(/\\/g, "/");
}

export function comparePaths(a: string, b: string): boolean {
	return path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
}

export function isSubPath(parent: string, child: string): boolean {
	const rel = path.relative(parent, child);
	return !!rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

export function ensureTrailingSlash(p: string): string {
	return p.endsWith("/") ? p : p + "/";
}

export function removeTrailingSlash(p: string): string {
	return p.replace(/\/+$/, "");
}

export function getFileName(p: string): string {
	return p.split(/[\\/]/).pop()!;	
}

export function getFileNameWithoutExt(p: string): string {
	return path.parse(p).name;
}

export function replaceExt(p: string, ext: string): string {
	const parsed = path.parse(p);
	return path.join(parsed.dir, parsed.name + ext);
}

export function isDirectoryPath(p: string): boolean {
	return p.endsWith("/") || p.endsWith("\\");
}

export function splitPath(p: string): string[] {
	return p.split(/[\\/]/).filter(Boolean);
}

export function commonPath(paths: string[]): string | null {
	const split = paths.map(p => p.split(/[\\/]/));

	return !split.length ? null : split[0]!
		.filter((_, i) => split.every(p => p[i] === split[0]![i]))
		.join("/");
}

export function pathDepth(p: string): number {
	return p.split(/[\\/]/).filter(Boolean).length;
}

export function isRootPath(p: string): boolean {
	return path.parse(p).root === p;
}
