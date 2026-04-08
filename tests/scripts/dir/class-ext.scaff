impl MyClass {
    static create() {
        return new MyClass();
    }

    show_all = () => {
        show_debug_message($"Name: {name}, Age: {age}, Active: {is_active}");
    }
}

impl Test {
    static created_count = 0;

    static create(_new?) {
        if (_new == undefined) {
            Test.created_count++;
            return new Test();
        }
    }


    const get_created_count = () => {
        return Test.created_count;
    }
}