export class Test {
	constructor() 
    
    print() {
		show_debug_message("Hello, from Test!");
	}
}

impl Test {
    print_impl(_msg?) {
        show_debug_message(_msg ?? "Hello, from Test impl!");
    }
}
