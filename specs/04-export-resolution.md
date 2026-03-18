# Export Resolution & Module Store

## Source: `src/parser/export-module.ts`

---

## Entry Point: `getExportedModules()`

Iterates over `fileGroup.scaff` (and `fileGroup.generate` is intentionally excluded here, generate files' exports are handled separately via re-export if needed). For each file, it scans line-by-line looking for top-level `export` declarations.

**Key constraint:** Only processes files in `fileGroup.scaff`. Generate files (those with `intg`) are not scanned for exports by this function.

---

## Line-by-Line Scanning Strategy

The function uses a manual `while (i < lines.length)` loop rather than regex over the full file. For each line starting with `export `, it identifies the declaration type and then collects subsequent lines until the construct is closed (brace counting via `countBraces()`).

### `countBraces(line)`

Counts `{` as +1 and `}` as -1 per character, skipping characters inside string literals. The loop exits when `braceCount <= 0` and the line ends with `}` or `;`.

**Known limitation:** Does not handle template literals (backtick strings). A `{` inside a template literal will throw off the brace count.

---

## Module Store Key

Each file's exports are stored under:

```ts
const filePath = file.isIndex ? file.path : `${file.path}/${file.name}`;
```

This is the **absolute normalized path without extension**. All lookups from import/include statements resolve their `from` paths to the same format for matching.

---

## Per-Declaration Processing

### `export function`

```ts
module[filePath][name] = {
  name, type: 'function',
  value: body.slice(1, -1),  // body without outer braces
  parsedStr: `function ${name}(${params.combined.join(", ")}) ${body}`
}
```

`parseFnParams()` extracts parameter names and defaults. Optional params (`?`) become `= undefined` in `combined`.

### `export class`

1. Constructor params extracted via `constructor\s*\(([^)]*)\)` regex
2. Constructor line removed from class body
3. `convertClassMethods()` converts shorthand methods to `method = function(...)`
4. Arrow functions in the body are converted to `function` form
5. Result:

```ts
parsedStr = `function ${name}(${constructor}) constructor {\n\t${classBody}\n}`
```

**Note:** `implementClass()` (separate phase) will later append `impl` block bodies to this `parsedStr` before it's used.

### `export interface` / `export type`

Both call `getObjectMembers()` which builds a `member` map:

```ts
member: {
  [memberName]: { type: inferred, value: defaultValue }
}
```

Member type is inferred from the inline annotation (e.g. `: number`) via `inferInlineType()`. Default value comes from the `= value` part, or `undefined` for optional members (`?`), or `getDefaultValue(type)` for typed members with no explicit default.

**`extends` / `&` intersection handling:** If an interface extends another, or a type uses `&`, `getObjectMembers()` copies members from the referenced type into the result. If the referenced type isn't in the store yet, it's added to `retryList[]` and processed after the main loop.

### `export enum` / `export const enum`

The `parsedStr` is the enum body with `export` (and `const` for const enums) stripped.

### Arrow functions / function expressions (`export const x = ...`)

Three sub-cases:
1. **Arrow function (multiline)**, collects lines until braces close, builds `name = function(params) { body }`.
2. **Arrow function (single-line)**, `name = function(params) { return body; }`.
3. **Function expression**, similar to arrow, wrapped in `function`.
4. **Variable/const** -> `var`/`let` -> GML variable assignment, `const` -> `#macro name value`.

---

## `retryList` - Deferred Interface/Type Resolution

When `getObjectMembers()` encounters an `extends` or `&` reference to a type that isn't in the store yet, it pushes to `retryList[]`:

```ts
type ScaffModuleRetry = { filePath: string; name: string; targetName: string }
```

After the main loop, a second pass over `retryList` copies members from now-resolved types into the waiting interfaces/types.

**Limitation:** Only one level of retry. If `A extends B extends C` and all three are in the same file processed in order `A, B, C`, only `B`'s members from `C` will be available. Circular references are not detected and will silently produce incomplete member maps.

---

## Helper Functions (exported, used elsewhere)

### `parseFnParams(str)`
Extracts param names, defaults, and a `combined` array (name with `= default` if applicable). Used by both export resolution and `class-implement.ts`.

### `convertClassMethods(classBody)`
Converts `methodName(params) { body }` shorthand to `methodName = function(params) { body }` using a regex replace. Does not handle nested braces correctly for methods with complex bodies, relies on the outer brace collector having already isolated the method.

### `insertTabs(count, tabType)`
Generates an indentation string of `count` units of the given tab type. Used when building class `parsedStr` and when re-indenting `@content` injections.
