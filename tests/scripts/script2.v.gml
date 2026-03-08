export interface MyInterface {
	name,						// no type -> any
	age: number = 0, 
	address,
	is_active?: boolean = true
};

export type MyType = {
	name: string, 
	age: number, 
	is_active?: boolean
};

export interface MyExtInterface extends MyInterface {
	address: string = "somewhere", 
	phone?
};

export type MyExtType = MyType & {
	address: string, 
	phone?
};	

export type MyExtType2 = {
	score: number,
	phone?
} & MyType;	

export class MyClass {
	constructor(name, age = 0, is_active?)

	name = name;
	age = age;
	is_active = is_active ?? false;

	print = function() {
		show_debug_message($"Name: {name}, Age: {age}, Active: {is_active}");
	}

	show_name(name?) {				// converted to method
		show_debug_message(name);
	}

	show_age = (age?, test = false) => {		// converted to method
		show_debug_message(age);
	}
}
