# ScaffScript

A superset language of **GameMaker Language** (GML) for creating module-based GameMaker source codes. This minimal language is mainly used for developing GML libraries, but can also be used for other purposes.

> [!WARNING]
> This project is still in early development. The syntax and features are subject to change. Use at your own risk.

## Key Features

- Unify multiple source files into a single source file.
- TypeScript-like syntax and module system.
- Flexible configuration options.
- Dev-friendly CLI interface.
- Togglable integration (auto/manual) to your GameMaker project.
- And more... (WIP)

## Installation

1. Install [Bun](https://bun.sh) (if not already installed).
2. Clone this repository.
3. Install dependencies:

```bash
bun install
```

4. Run:

```bash
bun run scaff <target_path>		# target_path = `src/` by default
```

## Usage

Use `*.ss` files to mark a file as a Scaff file. Normal `*.gml` files are still supported, but they are not processed by Scaff.

### Export Module

1. Use `export` statement to export types (a variable, function, class, interface, type, enum, or arrow function) from a Scaff file. 

```js
// my_file.ss

export var my_var = 1;
export let my_let = 2;						// `let` will be removed, so it'll become an instance variable
export const MY_CONST = "Hello, World!";	// `const` will be converted to `#macro`

export function my_func() {
	show_debug_message("Hello, World!");
}

// arrow functions will be converted to function expression or method
export const my_method = (name: string, age: number) => {
	show_debug_message(`Hello, ${name}! You are ${age} years old.`);
}

export enum MY_ENUM {
	A,
	B,
	C
}

// classes will be converted to struct constructor
export class MyClass {						
	constructor(name: string, age: number)

	name: string = "";
	age: number = 0;

	show_name() {
		show_debug_message(this.name);
	}
}

// interfaces and types will be converted to struct
export interface MyInterface {
	name: string;
	age: number = 0;				// default value is allowed, which not allowed in TypeScript
	isActive?: boolean;				// optional property is allowed
}

// interfaces can be extended
export interface MyExtInterface extends MyInterface {
	address: string;
}

export type MyType = {
	name: string = "";				// default value is allowed, which not allowed in TypeScript
	age: number;
	isActive?: boolean;				// optional property is allowed
}

// types intersection is allowed
export type MyIntersectedType = MyType & {
	address: string;
}
```

You can do a barrel export (`export * from "<path>"`) as well, so that you can import modules from the parent directory:

```js
// index.ss

export * from "my_file";			// export all types from "my_file"
```

2. Use `impl` statement to add implementation to a class.

```js
// my_file.ss

export class MyClass {
	constructor(name: string, age?: number)

	name: string = "";
	age: number = 0;
}

impl MyClass {
	show_age() {
		show_debug_message(age);
	}
}
```

You can split the implementation into multiple files as well:

```js
// set.ss

impl MyClass {
	set_age(age: number) {
		age = age;
	}

	// static method
	static static_method = (name: string) => {
		show_debug_message($"Hello, {name}!");
	}
}
```

### Import Module

1. Use `include` statement to import a module from another Scaff file, and replace the import statement with the actual content of the exported types.

```js
// my_other_file.ss

include { my_var, my_func, MyClass } from "my_file"

/**
 * The generated source code will replace the include statement with the actual content of the exported types.
 * 
 * For example, the above include statement will be replaced with:

 var my_var = 1;
 function my_func() {
 	show_debug_message("Hello, World!");
 }
 function MyClass(name, age) constructor {
 	// ...
 }

 */

// non-included lines will be left as is
show_debug_message("This line will be left as is.");

// you can include multiple modules in a single file
include my_enum from "my_file"
/**
 enum MY_ENUM {
  	A,
  	B,
  	C
 }
 */

 // you can include normal GML files as well
 include { "some_script.gml", "another_gml" } from "./scripts"	
 // must be in curly braces and double quotes, the order of the files will be preserved, the `.gml` extension is optional
```

2. Use `import` statement to import a module from another Scaff file, and then use `@<keyword>` statements to load and replace the content of a Scaff file to certain places in the code.

| Keyword | Description | Example |
| --- | --- | --- |
| `@content` | Replace the statement with the actual content of the exported type. | `@content my_var` -> `var my_var = 1;` |
| `@nameof` | Replace the statement with the **name** of the exported type. | `@nameof my_var` -> `"my_var"` |
| `@valueof` or `@:` | Replace the statement with the **value** of the exported type. | `@valueof my_var` -> `1`, `@:my_var` -> `1` |
| `@typeof` | Replace the statement with the **type** of the exported type. | `@typeof my_var` -> `"number"` |
| `@use` | Replace the statement with the object shape of the exported type. Only works with `interface` or `type`. | `var obj = @use MyInterface { name: "John" }` -> `var obj = { name: "John", age: 0, isActive: false };` |

```js
// my_import.ss

import { my_var } from "my_file"

show_debug_message(@valueof my_var);	// 1
show_debug_message(@:my_var);			// 1
show_debug_message(@typeof my_var);		// "number"
show_debug_message(@nameof my_var);		// "my_var"
show_debug_message(@content my_var);	// var my_var = 1;
```

```js
// my_other_file.ss

import * from "my_file"

my_method = function() {
	@content my_var;					// replace with `var my_var = 1;`
	var hello = @valueof MY_CONST;		// replace with `var hello = "Hello, World!";`
	var obj = @use MyInterface { 		// replace with `var obj = { name: "John", age: 0, isActive: false };`
		name: "John" 
	};
	
	show_debug_message(my_var);			// 1
	show_debug_message(obj.name);		// John

	var inst = new MyClass("John", 20);	
	inst.show_age();					// 20
}
```

> [!WARNING]
> If you use any of the `@` statements without importing the module first, the statement will be left as is, which won't be processed by Scaff, and won't be accepted by GameMaker. Even so, there are some exceptions for non-module `@` statements. Check the special `@` statements below (WIP).

| Keyword | Description | Example |
| --- | --- | --- |
| `@now` | Replace the statement with the current timestamp in ISO 8601 format. | `var now = "@now";` -> `var now = "2021-01-01T00:00:00.000Z";` |
| `@today` | Replace the statement with the current date in ISO 8601 format. | `var today = "@today";` -> `var today = "2021-01-01";` |
| `@version` | Replace the statement with the current version of Scaff. | `var version = "@version";` -> `var version = "0.1.0";` |
| `@file` | Replace the statement with the current file name. | `var file = "@file";` -> `var file = "my_file";` |
| `@line` | Replace the statement with the current line number. | `var line = @line;` -> `var line = 1;` |
| `@counter` | Replace the statement with an increasing number. | `var counter = @counter;` -> `var counter = 1;`, `var counter = @counter;` -> `var counter = 2;`, etc. |


### GameMaker Integration

Use `intg` statement to mark this file as an integration target, and `#[<name_or_event>]` statement to mark a block of code as a write target. The content of the file will be written to the actual GameMaker project.

```js
// my_file.ss

intg { main, some_mod } to "./scripts/my_script"				// integrate to `scripts/my_script/my_script.gml`

#[main]
show_debug_message("Hello, from my_script!");

#[some_mod]
show_debug_message("Hello, from my_script (some_mod)!");

#[some_mod -- prod]
show_debug_message("Hello, only in production!");
```

```js
// my_other_file.ss

intg * to "objects/my_object"		// integrate to `objects/my_object/*`
intg { Step, keydown:keyboard_d } to "objects/my_other_object"	

// method 1
#[main as create]					// integrate to `objects/my_object/Create_0.gml`
show_debug_message("Hello, from my_object create event!");

// method 2
#[StepEvent]						// <event_name>Event is also supported				
show_debug_message("Hello, from my_object step event!");

// method 3
#[key as KeyPress:KEYBOARD_ENTER]	// use `:` to specify the event number KEYBOARD_ENTER in this case)
show_debug_message("Hello, from my_object keypress - enter event!");

// method 4
#[keydown:keyboard_d event]			// the `event`, event type, and event number are case insensitive, add `event` suffix to mark as event (like in method 2 example)
show_debug_message("Hello, from my_object keydown - d event!");
```

> [!NOTE]
> If you're using method 2 or 4, the `event` keyword is required to mark the block as an event. 
> The `event` keyword will be omitted in the block name, so `#[StepEvent]` will become `Step` in the integration block (example: `intg { Step } to "objects/my_object"`, notice no `Event` suffix).
> If you're creating (not modifying) a new **collision** event, you need to specify the name of the other object (case sensitive, exact name of the object in the IDE, such as `obj_player`). And you need to reopen the IDE if you're creating a new collision event using Scaff integration.

### Configuration

Create a `scaff.config.<ts\|mjs\|cjs|json>` file in the root of your project with the following content:

```ts
// scaff.config.ts

import type { ScaffConfig } from "vgml-cli";

export default {
	// ...
} satisfies ScaffConfig;
```

```js
// mycli.config.mjs

export default {
	// ...
};
```

```js
// mycli.config.cjs

module.exports = {
	// ...
};
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `acceptAllIntegration` | `boolean` | `false` | Accept all generated files to be integrated without manual confirmation. |
| `clearOutputDir` | `boolean` | `false` | Clear the output directory before generating source code. |
| `counterStart` | `number` | `1` | Starting value for the counter special value. |
| `debugLevel` | `0 \| 1 \| 2` | `0` | Debug level. `0` = no debug, `1` = basic debug, `2` = verbose debug. |
| `integrationOption` | `ScaffIntegrationOptions` | `{}` | Integration options. |
| `noBackup` | `boolean` | `false` | Don't backup the original files before integration. |
| `noIntegration` | `boolean` | `false` | Don't integrate the files to GM project. |
| `onNotFound` | `"error" \| "ignore"` | `"error"` | What to do when something is not found. |
| `path` | `Record<string, string>` | `{}` | Path aliases. |
| `production` | `boolean` | `false` | Whether the script is running in production mode. |
| `tabType` | `"1t" \| "2s" \| "4s"` | `"1t"` | Tab type to use when generating source code. |
| `targetPlatform` | `ScaffIntegrationTargetPlatform` | `"all"` | Target platform for the generated code. |
| `useGmAssetPath` | `boolean` | `false` | Whether to use GM asset path when integrating files. |
