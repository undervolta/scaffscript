export interface MyInterface {
	name,						// no type -> any
	age: number, 
	is_active?: boolean
}

export type MyType = {
	name: string, 
	age: number, 
	is_active?: boolean
}

export interface MyExtInterface extends MyInterface {
	address: string, 
	phone?
}

export type MyExtType = MyType & {
	address: string, 
	phone?
}

export class MyClass {
	constructor(name, age = 0, is_active?)

	name = name;
	age = age;
	is_active = is_active ?? false;

	print = function() {
		show_debug_message($"Name: {name}, Age: {age}, Active: {is_active}");
	}

	show_name() {				// converted to method
		show_debug_message(name);
	}

	show_age = () => {			// converted to method
		show_debug_message(age);
	}
}
