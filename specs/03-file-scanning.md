# Spec: File Scanning & Grouping

## Sources: `src/fs/scan.ts`, `src/fs/grouping.ts`

---

## Phase 1: File Discovery - `getScaffFiles()`

Calls `readdir(path, { withFileTypes: true, recursive: true })` and filters for:
- `*.ss` files → `isScaff: true`
- `*.gml` files → `isScaff: false`

Each result becomes a `ScaffFile`:
```ts
type ScaffFile = {
  name: string;        // set to filename without extension during grouping
  path: string;        // absolute, normalized (forward slashes) parent directory
  isScaff: boolean;
  isIndex: boolean;    // true only if original filename === "index.ss"
  toGenerate: boolean; // true if file content contains an `intg` statement
  content: string;     // populated in grouping phase
  childs: ScaffFile[]; // impl child files attached here
}
```

`path` is normalized with `normalizePath()` (replaces backslashes -> forward slashes) and resolved with `resolvePath()` (`path.resolve()`). All subsequent path comparisons use this normalized form.

---

## Phase 2: Grouping - `readAndSplitFiles()`

Reads each file's content via `fsRuntime.readText()`, normalizes CRLF -> LF, then processes it.

### Special Value Pre-processing

For `.ss` files only: `parseSpecialValues(file, counter)` runs immediately after content is read. Counter state is a shared mutable `{ count: number }` object, mutations persist across all files in the run.

### `toGenerate` Detection

```ts
const intgRegex = /intg (\{[A-Za-z0-9,*\s]+\}|[A-Za-z0-9,*]+) to/;
file.toGenerate = intgRegex.test(file.content);
```

Note: this is a **simplified** regex (not the full `intgRegex` from `parser/regex.ts`). It's only used here for a quick presence check, not for extraction.

### Name Stripping

`.ss` extension is removed from `file.name`. `index.ss` files get their name set to `""`. Their module store key is the directory path, not `dir/index`.

### File Categorization

Files are categorized into four buckets during the loop:

| Bucket | Condition |
|--------|-----------|
| `indexes[]` (deferred) | `file.isIndex === true` |
| `exports[]` (deferred) | content matches `modControlRegex` (has any `export`/`import`/`include` statement) |
| `implFiles[]` (deferred) | content matches `implRegex` (has `impl ClassName {`) |
| `res.generate` | `.ss` + `toGenerate: true` + no `impl` + no module control |
| `res.scaff` | `.ss` + no `intg` + no `impl` + no module control |
| `res.normal` | `.gml` file |

### Depth-Based Ordering

Both `exports[]` and `indexes[]` are sorted by **descending directory depth** before being processed:

```ts
exports.sort((a, b) => b.depth - a.depth);
```

Depth = `file.path.split("/").filter(Boolean).length`.

This ensures deeply nested files register their exports before their parent directories, so barrel (`index.ss`) files at shallower depths can re-export from deeper files correctly.

### `impl` File Attachment

After all export/index files are placed:
1. Each `impl` file's class name is extracted via `implRegex`.
2. The class is searched in `res.scaff` then `res.generate` for `class ${className} {`.
3. If found → pushed to that file's `childs[]`.
4. If not found → `onNotFound` determines error vs. warning.

### `ScaffFileGroup` Output

```ts
type ScaffFileGroup = {
  generate: ScaffFile[];  // files with intg statements, these produce output
  scaff: ScaffFile[];     // module provider files
  normal: ScaffFile[];    // raw .gml files (include targets only)
}
```

---

## Edge Cases & Known Limitations

- **`.gml` files are never parsed for module syntax.** They are only used as `include` targets. If a `.gml` file contains text that looks like an `export` statement, it's ignored.
- **`index.ss` name erasure.** Setting `file.name = ""` is load-bearing. The module store key for index files is just `file.path`. If code elsewhere constructs a key as `${file.path}/${file.name}`, an index file correctly produces `path/` (with no trailing name), which normalizes to just `path`. Double-check any new code that constructs these keys.
- **`toGenerate` detection uses a separate simplified regex** from the full `intgRegex` in `parser/regex.ts`. If the `intg` syntax changes, both regexes need to be updated.
- **Counter is global per run.** There's no per-file reset. If you run **ScaffScript** on a large codebase, `@counter` values will be high numbers in later files. This is intentional but can be surprising.
- **`readAndSplitFiles` returns `null` on error** (when `onNotFound: "error"` and a class isn't found). The caller in `main()` checks for this and aborts. Any new error path in this function must also return `null`.
