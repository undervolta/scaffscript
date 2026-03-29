export class Test {
	constructor() 
    
    print() {
		show_debug_message("Hello, from Test!");
	}
}

impl Test {
    print_impl() {
        show_debug_message("Hello, from Test impl!");
    }
}
