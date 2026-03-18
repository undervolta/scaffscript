# Class System

ScaffScript provides a class syntax that compiles to GML struct constructors. Classes can also be extended across multiple files using `impl`.

---

## `class` Declaration

```ts
export class MyClass {
    constructor(name, age = 0, is_active?)

    name = name;
    age = age;
    is_active = is_active ?? false;

    print = function() {
        show_debug_message($"Name: {name}");
    }

    show_name(name?) {
        show_debug_message(name);
    }

    show_age = (age?, test = false) => {
        show_debug_message(age);
    }
}
```

### Constructor

The `constructor(...)` line defines the parameters of the GML constructor function. It **must** appear before any properties or methods. No `{...}` or `;` after it. Optional parameters (`?`) compile to `= undefined`.

### Properties

Plain assignments, become direct assignments inside the constructor body:

```ts
name = name;
age = age;
```

### Methods

All three forms compile to `method = function(...)`:

```ts
// function expression, unchanged
print = function() { ... }

// shorthand, converted
show_name(name?) { ... }
// -> show_name = function(name = undefined) { ... }

// arrow function, converted
show_age = (age?, test = false) => { ... }
// -> show_age = function(age = undefined, test = false) { ... }
```

### Static Methods

```ts
export class MyClass {
    static static_method() {
        show_debug_message("Hello!");
    }
}
```

Compiles to:

```ts
function MyClass() constructor {
    static static_method = function() {
        show_debug_message("Hello!");
    }
}
```

### Full Compiled Output

```gml
function MyClass(name, age = 0, is_active = undefined) constructor {
    name = name;
    age = age;
    is_active = is_active ?? false;

    print = function() {
        show_debug_message($"Name: {name}");
    }

    show_name = function(name = undefined) {
        show_debug_message(name);
    }

    show_age = function(age = undefined, test = false) {
        show_debug_message(age);
    }
}
```

---

## `impl` - Extending a Class

`impl` adds properties or methods to an existing class from a **separate file**. Useful for splitting large classes.

```ts
// script3.ss
impl MyClass {
    my_prop = 1;

    set_age(age) {
        age = age;
    }

    static const static_method = (name?) => {
        show_debug_message($"Hello, {name}!");
    }
}
```

The `impl` body is merged into the parent class before output. `impl` files themselves produce no direct output.

### Rules

- The class name must match an `export class` in another file in the same scan.
- If no match is found: aborts if `onNotFound: "error"`, skips with a warning if `"ignore"`.
- Method syntax inside `impl` follows the same conversion rules as regular class methods.
- Multiple `impl` files for the same class are all merged in order.
