import path from "path";

/**
 * Resolve the given path to absolute path
 * @param p Path to resolve
 * @returns Absolute path
 */
export function resolvePath(p: string): string {
	return path.resolve(p);
}

/**
 * Normalize a path by replacing backslashes with forward slashes
 * @param p Path to normalize
 * @returns Normalized path with forward slashes
 */
export function normalizePath(p: string): string {
	return p.replace(/\\/g, "/");
}

/**
 * Get the relative path from the given root path
 * @param p Path to get relative path from
 * @param root Root path
 * @returns Relative path
 */
export function relativePath(p: string, root: string): string {
	return path.relative(root, p);
}

/**
 * Compare two paths for equality, resolving them to absolute paths and ignoring case
 * @param a First path to compare
 * @param b Second path to compare
 * @returns True if paths are equal, false otherwise
 */
export function comparePaths(a: string, b: string): boolean {
	return path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
}

/**
 * Check if a path is absolute
 * @param p Path to check
 * @returns True if path is absolute, false otherwise
 */
export function isAbsolute(p: string): boolean {
	return path.isAbsolute(p);
}

/**
 * Check if a path is a subpath of another path
 * @param parent Parent path
 * @param child Child path to check
 * @returns True if child is a subpath of parent, false otherwise
 */
export function isSubPath(parent: string, child: string): boolean {
	const rel = path.relative(parent, child);
	return !!rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

/**
 * Ensure a path ends with a trailing slash
 * @param p Path to modify
 * @returns Path with trailing slash
 */
export function ensureTrailingSlash(p: string): string {
	return p.endsWith("/") ? p : p + "/";
}

/**
 * Remove trailing slashes from a path
 * @param p Path to modify
 * @returns Path without trailing slashes
 */
export function removeTrailingSlash(p: string): string {
	return p.replace(/\/+$/, "");
}

/**
 * Get the file name from a path (including extension)
 * @param p Path to extract file name from
 * @returns File name with extension
 */
export function getFileName(p: string): string {
	return p.split(/[\\/]/).pop()!;	
}

/**
 * Get the file name from a path without extension
 * @param p Path to extract file name from
 * @returns File name without extension
 */
export function getFileNameWithoutExt(p: string): string {
	return path.parse(p).name;
}

/**
 * Replace the extension of a file path
 * @param p Original file path
 * @param ext New extension (should include the dot, e.g., '.txt')
 * @returns Path with new extension
 */
export function replaceExt(p: string, ext: string): string {
	const parsed = path.parse(p);
	return path.join(parsed.dir, parsed.name + ext);
}

/**
 * Check if a path represents a directory (ends with slash)
 * @param p Path to check
 * @returns True if path ends with '/' or '\', false otherwise
 */
export function isDirectoryPath(p: string): boolean {
	return p.endsWith("/") || p.endsWith("\\");
}

/**
 * Split a path into its components
 * @param p Path to split
 * @returns Array of path components, excluding empty strings
 */
export function splitPath(p: string): string[] {
	return p.split(/[\\/]/).filter(Boolean);
}

/**
 * Find the common prefix path among an array of paths
 * @param paths Array of paths to compare
 * @returns Common prefix path or null if no paths provided
 */
export function commonPath(paths: string[]): string | null {
	const split = paths.map(p => p.split(/[\\/]/));

	return !split.length ? null : split[0]!
		.filter((_, i) => split.every(p => p[i] === split[0]![i]))
		.join("/");
}

/**
 * Get the depth (number of directories) in a path
 * @param p Path to analyze
 * @returns Number of path components
 */
export function pathDepth(p: string): number {
	return p.split(/[\\/]/).filter(Boolean).length;
}

/**
 * Check if a path is a root path (e.g., 'C:\' or '/')
 * @param p Path to check
 * @returns True if path is a root path, false otherwise
 */
export function isRootPath(p: string): boolean {
	return path.parse(p).root === p;
}
