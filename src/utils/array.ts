/**
 * Swap the element at the given index with the last element, and then pop the last element
 * @param arr Array to swap and pop from
 * @param idx Index of the element to swap
 * @returns The swapped element
 */
export function swapAndPop<T>(arr: T[], idx: number): T {
	const lastIdx = arr.length - 1;
	const last = arr[lastIdx];

	arr[lastIdx] = arr[idx]!;
	arr[idx] = last!;

	return arr.pop()!;
}
