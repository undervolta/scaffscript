# Import & Include Resolution

## Source: `src/parser/import-module.ts`

---

## Entry Points

### `implementModules(module, fileGroup, file, config, mods?)`

Top-level function called once per file in `main()`. It:
1. Calls `getModuleUsage()` to find all module control statements in the file.
2. Iterates over each usage and transforms `file.content` in-place.

### `getModuleUsage(module, fileGroup, file, config)`

Finds all matches of `modControlRegex` in `file.content` and resolves each to a `ScaffModuleUsage` object. Processes matches in batches of 10 using `Promise.all` for parallel resolution.

---

## `modControlRegex`

```ts
/(?<cmd>export|import|include)\s+(?<mod>\*|\{[^}]+\}|[A-Za-z0-9_]+)\s+(?<src>from)\s+(?<path>["'][^"']+["'])\s*;?/g
```

Captures:
- `cmd`: `export` | `import` | `include`.
- `mod`: `*`, `{ Name1, Name2 }`, or a single identifier.
- `path`: the quoted path string (quotes included in capture).

The path is unquoted with `.slice(1, -1)` before use.

---

## Path Resolution

```ts
const fromPath = normalizePath(resolvePath(
  `${file.path}/${config.path[rawPath] ?? rawPath}`
));
```

The `config.path` alias map is checked first. If no alias matches, the raw path is used. The result is an absolute, normalized path. This must match a key in the `ScaffModuleStore` exactly.

**Edge case:** `include` with raw file paths (e.g. `include { "file.gml" } from "."`) follows a different code path. It does not look up the module store but instead tries to find a `ScaffFile` in `fileGroup.normal` or checks disk directly via `fileExists()`.

---

## Per-Command Behavior

### `export` (re-export)

Copies modules from the source path into the current file's module store entry:

```ts
module[thisPath][value.as] = value.value;
```

This allows downstream files that import from the current file's path to see the re-exported names. The current file's path key is created if it doesn't exist yet.


### `include`

Two sub-cases:

**1. Module includes** (`include { ModName } from "path"`):

Builds a `toReplace` string by concatenating the `parsedStr` of each named module, then:

```ts
file.content = file.content.replace(mod.targetStr, toReplace);
```

Extra blank lines are inserted between `object`/`method`/`array`/`enum` type modules for readability.

**2. File includes** (`include { "file.gml" } from "dir"`):

Reads each file's raw content (from `ScaffFile.content` if available, otherwise from disk), concatenates with `\n\n` separators, and replaces the include statement.

### `import`

1. The `import` statement itself is **removed** from `file.content` (replaced with `""`).
2. Three regex passes run over the (now statement-free) content:
   - `contentModRegex` -> `@content`, `@nameof`, `@typeof`, `@valueof`.
   - `contentModShortRegex` -> `@:ModName`.
   - `useModRegex` -> `@use ModName { ... }`.

Each match is checked against `mod.modList`. If the referenced name isn't in the current import's modList, it's skipped (allows multiple imports to each handle their own names independently).

---

## `@content` Indentation Re-alignment

When `@content ModName` is found inside an indented context, the injected `parsedStr` is re-indented to match:

```ts
const tabCnt = countTabsBeforeSubstring(file.content, match[0], tabChar);
const tabLevels = getTabLevels(parsedStr, config.tabType).map(l => l + tabCnt);
```

`countTabsBeforeSubstring()` finds the `@content` position, walks back to the last `\n`, then counts leading tab characters. `getTabLevels()` returns per-line indent depths for the `parsedStr`, which are then shifted by `tabCnt` before joining.

**Known limitation:** Only handles uniform tab-based indentation. Mixed tabs/spaces will produce incorrect results.

---

## `@use` Struct Generation

`useModRegex` captures the interface/type name and the `{ key: value, }` body. Processing:

1. Splits the body into `[key, value]` pairs.
2. Iterates over the interface's `member` entries in definition order.
3. For each member, uses provided value if given, else uses interface default.
4. Appends any extra pairs not in the interface at the end.
5. Uses `swapAndPop()` to remove matched pairs from the working list efficiently.

Output is a GML struct literal indented to the surrounding context.

---

## Alias Handling

When a module is imported with an alias (`{ Original: Alias }`):
1. `modList[Alias] = { name: "Original", as: "Alias", usingAlias: true, value: ... }`.
2. A shadow entry is written to the module store: `module[fromPath]["@Alias"] = value`.
3. Decorator lookups check for `@AliasName` first, then fall back to the plain name.

---

## Error Flow

`getModuleUsage()` uses an `isInvalid` flag. Any error sets `isInvalid = true` and breaks out of the batch loop. The function returns `null` on any invalid state. `implementModules()` propagates `null` up to `main()`, which checks `implMods.every(...)` to abort the run.

The validation in `main()` is:

```ts
implMods.every(modUsage => modUsage && (
  modUsage.length === 0 || (
    modUsage.length && modUsage.every(mm => mm && mm.cmd)
  )
))
```

A `null` entry or an entry with `cmd: null` both cause abort.
