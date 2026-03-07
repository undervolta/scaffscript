export x = 1;
export var y = 2;
export let z = 3;
export const STRING = "string";

export function test() {
	show_debug_message($"test from file1, x = {x}, y = {y}, \"{");
}

export const method = () => {
	show_debug_message("from file1");
}
