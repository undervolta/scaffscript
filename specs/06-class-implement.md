# Class Implementation (`impl`)

## Source: `src/parser/class-implement.ts`

---

## Purpose

`impl` blocks allow contributors to split a class's methods across multiple `.ss` files. The `implementClass()` function merges those child files' method bodies into the parent class's `parsedStr` before any output is generated.

This runs **after** `getExportedModules()` (so the parent class's `parsedStr` is already built) and **before** `implementModules()` (so the merged class is available for `@content` injection).

---

## `implementClass(module, fileGroup, config)`

Collects all `{ parent, file }` pairs from `fileGroup.scaff[*].childs` and `fileGroup.generate[*].childs`. Then for each pair:

1. Determines the parent's module store key:

   ```ts
   const filePath = parent.isIndex ? parent.path : `${parent.path}/${parent.name}`;
   ```

2. Calls `parseHeader(file.content)` to extract all `impl ClassName { ... }` blocks from the child file.

3. For each block: converts methods with `convertClassMethods()`, converts arrow functions with `convertArrowFn()`, then appends to the parent class's `parsedStr`.

### Append Strategy

The parent class `parsedStr` ends with `}\n`. The merge replaces that trailing `}` with the new body appended before the closing brace:

```ts
module[filePath][className].parsedStr = parsedStr.slice(0, -1) + `${body.replace('\n', "")}\n}\n`;
```

**Edge case:** `body.replace('\n', "")` only removes the **first** newline in the body (not a global replace). This is intentional to strip the leading newline from the `impl` block body before the opening brace, but it means a body starting with two newlines will have one remaining.

---

## `parseHeader(str, regex)`

Generic brace-balanced parser. Given a string and a header regex (defaults to `implHeaderRegex`), it:

1. Finds the header match, records `lastIndex` as the body start.
2. Walks character by character, tracking `{`/`}` and string literal boundaries (`"` or `'`).
3. Stops when `braceCount === 0`.
4. Returns `[{ name, body }]` where `body` is the content between the outer braces (exclusive).

This is also used by `convertArrowFn()` to handle arrow functions inside `impl` blocks.

**Known limitation:** Does not handle template literals (backtick strings). A `}` inside a template literal will prematurely close brace tracking.

---

## `convertArrowFn(str)`

Converts an arrow function expression at the top level of an `impl` block to a regular function assignment:

```ts
// input
const myFn = (arg?) => { ... }

// output  
myFn = function(arg = undefined) { ... }
```

Uses `parseHeader()` with `arrowFnHeaderRegex` to find the arrow function, `parseFnParams()` to extract params, then `str.replace()` to substitute.


---

## Early Return Logic

```ts
if (fileGroup.generate.length == 0 && fileGroup.scaff.length == 0) {
  log.warn("No files to implement classes from.");
  return false;
}
```

Returns `false` (not `null`) when there are no files. The caller in `main()` checks `if (!implValid) return`. So `false` aborts the run. This is intentional. If there are no scaff/generate files at all, something went wrong upstream.

However, if there are scaff/generate files but **none have childs**, the function proceeds normally and returns `true`. The `toImpl` array simply stays empty and the loop is a no-op.
