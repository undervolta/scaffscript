# Module System

ScaffScript's module system lets you share code between `.ss` files using `export`, `import`, `include`, and `export ... from`. These are compile-time only, so they're fully resolved and stripped before GML output is written.

---

## `export`

Marks a declaration as available for other files to consume.

### Variable / Constant

```ts
export var myVar = 10;           // -> var myVar = 10;
export let myLet = 20;           // -> myLet = 20;
export const MY_CONST = "hello"; // -> #macro MY_CONST "hello"
export x = 1;                    // -> x = 1;
```

### Function

```ts
export function myFunction(arg1, arg2?) {
    show_debug_message(arg1);
}
```

Optional parameters (`?`) compile to `= undefined`.

### Function Expression

```ts
export const myFunc = function(arg1) {
    show_debug_message(arg1);
}
```

### Arrow Function

```ts
export const myMethod = (arg1, arg2 = 0) => {
    show_debug_message(arg1);
}

// single-line
export const oneLiner = (x?) => show_debug_message(x);
```

Both arrow functions and function expressions compile to `name = function(...)`.

### Enum

```ts
export enum MyEnum {
    A,
    B,
    C
}

export const enum MyConstEnum {
    X = 20,
    Y = 30
}
```

`const enum` strips the `const` keyword in output.

### Class

```ts
export class MyClass {
    constructor(name, age = 0)

    name = name;
    age = age;

    print = function() {
        show_debug_message($"Name: {name}");
    }

    show_age(age?) {
        show_debug_message(age);
    }
}
```

Compiles to a GML struct constructor. See [Class System](./07-class-system.md) for details.

### Interface

```ts
export interface MyInterface {
    name,
    age: number = 0,
    address,
    is_active?: boolean = true
};

export interface MyExtInterface extends MyInterface {
    address: string = "somewhere",
    phone?
}
```

Defines a struct shape/template. Members support inline types, default values, and optional flag (`?`). Supports `extends`.

### Type

```ts
export type MyType = {
    name: string,
    age: number,
    is_active?: boolean
};

export type MyIntersectedType = MyType & {
    address: string,
    phone?
};
```

Similar to interfaces. Supports intersection (`&`) with other types.

---

## `import`

Imports exports from another `.ss` file. The statement itself is stripped from output. Imported names are available via content directives (`@content`, `@valueof`, etc.) in the same file.

```ts
import { ModuleName } from "path/to/file"
import { Name1, Name2 } from "path/to/file"
import { Original: Alias } from "path/to/file"  // alias with :
import * from "path/to/file"
```

```ts
import { y, z: my_z, arrow_fn } from "./script1"

@content arrow_fn
show_debug_message($"y = @:y, z = @typeof my_z");
```

---

## `include`

Inlines exported modules or raw `.gml` files directly at the point of the statement. Shorthand for `import` + `@content` for each module.

### Inlining exports

```ts
include { ModuleName } from "path/to/file"
include { Name1, Name2 } from "path/to/file"
include * from "path/to/file"
```

If `ModuleName` is `var x = 10`, the statement `include { ModuleName } from "path/to/file"` will be replaced with `var x = 10` in the output. It applies to all module types (variables, functions, classes, etc.).

### Inlining raw GML files

Use double-quoted filenames inside curly braces:

```ts
include { "filename.gml" } from "path/to/dir"
include { "file1.gml", "file2.gml" } from "."
```

The raw content of the `.gml` file is injected at that position. The target can be a file tracked by ScaffScript (from the scan) or any file path on disk. 

**Note:** You must use curly braces and double quotes for including raw GML files.

**Example:**

```ts
include { y, z } from "@scr1"
include { "normal.gml" } from "."
```

---

## `export ... from` (Re-export)

Re-exports modules from another file, making them available to files that import from the current one.

```ts
// my_file.ss
export function hello() {
    show_debug_message("Hello, World!");
}
```

```ts
// exporter.ss
export * from "./my_file"
```

Now you can import `hello` from `exporter`:

```ts
import { hello } from "./exporter"
```

---

## Path Resolution

All paths are resolved relative to the **current file's location**, then optionally mapped through `path` aliases in `scaff.config.ts`.

```ts
// scaff.config.ts
path: { "@scr1": "./script1" }
```

```ts
include { y } from "@scr1"  // resolves to ./script1, relative to this file
```

---

## `index.ss` Files

`index.ss` acts as a barrel file for its directory. It's always processed last among files at the same depth, so it can safely re-export everything from sibling files.

```ts
// my_dir/index.ss
export * from "./some_file"
export * from "./another_file"
```

```ts
// other.ss, import from the directory, not index directly
import { x } from "./my_dir"
```
