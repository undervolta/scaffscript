export const commentRegex = /(?<!\/)\/\/(?!\/)[^\n]*|\/\*(?!\*)[\s\S]*?\*\//g;

export const implRegex = /impl\s+(?<name>[\w+]+)\s+\{\s+(?<body>[.\s\S]+?)\}/g;	
export const implHeaderRegex = /impl\s+(?<name>\w+)\s*\{/g;

export const fnHeaderRegex = /(function|const|let|var)\s+(?<name>\w+)\s*\((?<params>[^)]*)\)\s*\{/g;
export const fnParamsRegex = /\((?<params>[^)]*)\)/g;
export const arrowFnHeaderRegex = /\b(?:(?:const|let|var)\s+)?(?<name>\w+)\s*=\s*(?<params>\([^)]*\)|\w+)\s*=>/g;
//export const arrowFnHeaderNoDeclRegex = /(?<![\w$])(?<params>\([^()]*\)|[A-Za-z_$][\w$]*)\s*=>\s*(?<singleBody>[^)]*)/g;

export const modControlRegex =
	/(?<cmd>export|import|include)\s+(?<mod>\*|\{[^}]+\}|[A-Za-z0-9_]+)\s+(?<src>from)\s+(?<path>["'][^"']+["'])\s*;?/g;

export const contentModRegex = /@(?<cmd>content|valueof|typeof|nameof)\s+(?<mod>[A-Za-z0-9_]+)/g;
export const useModRegex = /@use\s+(?<mod>[A-Za-z0-9_]+)\s+(?<body>\{[.\s\S]+?\})/g;
export const contentModShortRegex = /@:(?<mod>[A-Za-z0-9_]+)\s*/g;
export const specialValueRegex = /@(?<cmd>now|today|version|file|line|counter)/g;

export const tabRegex = {
	oneTab: /^(\t*)/gm,
	twoSpaces: /^(\ {2})*/gm,
	fourSpaces: /^(\ {4})*/gm
};

export const intgRegex = /intg\s+(?<targets>\*|\{[^}]+\}|[A-Za-z0-9_]+)\s+to\s+(?<path>["'][^"']+["'])\s*;?/g;
export const intgBlockRegex = /#\[(?<name>[^\]]+)\](?<body>[\s\S]*?(?=\n?#\[[^\]]+\]|$))/g;

/**
 * Count the number of occurrences of a substring in a string
 * @param str String to search in
 * @param sub Substring to search for
 * @returns Number of occurrences of the substring in the string
 */
export function countSubstring(str: string, sub: string): number {
	const regex = new RegExp(sub, 'g'); 
    const matches = str.match(regex); 

    return matches ? matches.length : 0;
}

/**
 * Get the tab levels of the given string
 * @param str String to search in
 * @param tabType Type of tab to search for
 * @returns Array of tab levels, separated by line
 */
export function getTabLevels(str: string, tabType: "1t" | "2s" | "4s"): number[] {
	const regex = tabType === "1t" 
		? tabRegex.oneTab 
		: (tabType === "2s" 
			? tabRegex.twoSpaces 
			: tabRegex.fourSpaces);

	const match = [...str.matchAll(regex)].map(m => m[0]!);

	return match.map(m => countSubstring(m, tabType === "1t" ? '\t' : (tabType === "2s" ? '  ' : '    ')));
}
