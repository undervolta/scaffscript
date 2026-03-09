export x = 1;
export var y = 2;
export let z = 3;
export const STRING = "string";

export function test(x?) {
	show_debug_message($"test from file1, x = {x}, y = {y}, \"{");
}

export const method = function(arg1, arg2) {
	show_debug_message("from file1 method");
}

export const arrow_fn = (arg1, arg2 = 0, arg3?) => {
	show_debug_message("from file1 arrow fn");
}

export const one_line_fn = (arg?) => show_debug_message("from file1 one line fn");

export enum MyEnum {
	A,
	B,
	C
}