# Parser, Module System, and Source Rewriting

## 1. Parsing Strategy

ScaffScript uses **regex-driven** extraction and replacement, not AST parsing. The relevant patterns live in [`src/parser/regex.ts`](../src/parser/regex.ts).

That means contributors need to think in terms of:

1. Pattern matching over raw text.
2. Order-sensitive string rewrites.
3. Brace and indentation heuristics.

This is fast to iterate on, but brittle when syntax becomes nested, ambiguous, or comment-sensitive.

## 2. Supported Export Forms

[`src/parser/export-module.ts`](../src/parser/export-module.ts) builds a `ScaffModuleStore` by scanning `file.content` line by line and collecting:

1. `export function`
2. `export class`
3. `export interface`
4. `export enum`
5. `export const enum`
6. `export type`
7. exported variables and function expressions inferred from `=`

Each export is normalized into an internal shape containing at least:

1. `name`
2. `type`
3. `value`
4. `parsedStr`

For functions and classes, extra preformatted fragments are also stored because later replacement logic depends on them directly.

## 3. Module Store Semantics

The module store key is not just the file name. It is effectively a normalized source path:

1. For regular files: `path/name`
2. For index files: `path`

This is important because `index.ss` behaves as the module identity for its directory.

Re-exports are merged into the current file's module namespace by [`reexportModule()`](../src/parser/export-module.ts). Aliases are stored using an `@`-prefixed synthetic key to avoid collisions with built-in terms.

## 4. `impl` Class Extension Flow

Class extension is handled in two phases:

1. [`src/fs/grouping.ts`](../src/fs/grouping.ts) detects files containing `impl`.
2. [`src/parser/class-implement.ts`](../src/parser/class-implement.ts) parses those bodies and appends them to the target class export.

The target class can be found:

1. In the parent file already linked through grouping
2. By scanning other grouped files when the first lookup misses

Before appending, implementation bodies are normalized by:

1. Resolving optional params into ` = undefined`
2. Converting class methods into function expressions
3. Converting arrow functions into function expressions

This design is pragmatic, but it has a tradeoff: class support is really a structured text transform into GML-style constructor bodies, not a deep semantic class model.

## 5. Import and Include Resolution

[`src/parser/import-module.ts`](../src/parser/import-module.ts) supports:

1. `import`
2. `include`
3. `export ... from ...` re-exports

Path resolution goes through `resolveImportPath()`, which supports:

1. Relative paths
2. Direct alias mappings from `config.path`
3. Wildcard aliases
4. `~`-prefixed aliases that resolve relative to `config.source`

The implementation then removes module control statements from file content, except `include`, which is replaced with generated content.

## 6. Content Directives

Imported modules can be consumed through inline directives:

1. `@content ModuleName`
2. `@valueof ModuleName`
3. `@typeof ModuleName`
4. `@nameof ModuleName`
5. `@:ModuleName`
6. `@use ModuleName { ... }`

These directives are expanded by textual replacement against the module store.

### 6.1 `@content`

Injects the normalized source representation of a module. Indentation is preserved heuristically using detected tab depth and configured tab style.

### 6.2 `@valueof` and `@:`

Inject the raw value or short-form value. For functions, `@valueof` has special handling to avoid injecting the wrong wrapper shape.

### 6.3 `@typeof` and `@nameof`

Inject metadata about the imported symbol rather than its body.

### 6.4 `@use`

Creates an object-like expansion from an interface or type model. It merges:

1. Default values inferred from the type/interface definition
2. User-provided overrides from the `@use` body

This is effectively a compile-time shape expansion helper.

## 7. Special Values

[`src/parser/special-value.ts`](../src/parser/special-value.ts) supports:

1. `@now`
2. `@today`
3. `@version`
4. `@file`
5. `@line`
6. `@counter`

Important behavior notes:

1. Comments are stripped before these replacements happen.
2. `@line` is computed after comment removal, so it refers to transformed content line numbers, not necessarily the original author-visible source line.
3. `@counter` mutates shared state as files are processed, so output depends on traversal order.

## 8. Parser Edge Cases and Limitations

Contributors should keep these limitations front-of-mind:

1. Regex parsing can misbehave with unusual nesting, tricky comments, or strings that resemble syntax markers.
2. `inferType()` and interface/type inference are heuristic, not semantic.
3. Class and function extraction rely on brace counting, which is safer than single-line regex but still not fully syntax-aware.
4. Some replacements mutate `file.content` repeatedly, so earlier rewrites can influence later match positions.
5. Alias handling stores synthetic `@alias` keys in the same module map, which is convenient but easy to forget when refactoring.

## 9. Good Contributor Moves in This Area

When changing parser behavior:

1. Update or add regexes in one place first.
2. Trace how the result affects `ScaffModuleStore`.
3. Verify the output shape expected by `implementModules()`.
4. Check whether generation and integration phases assume a particular `parsedStr` format.

If syntax support becomes significantly more complex, moving toward tokenization or AST parsing would be a legit architectural upgrade. Right now the project is still on the edge where regex is workable, but yeah, it is not infinitely scalable.
