# File Scanning

**ScaffScript** recursively scans your source directory for `*.ss` and `*.gml` files. Understanding how files are discovered and ordered helps when structuring larger projects.

---

## What Gets Scanned

Both `.ss` and `.gml` files are picked up from the `scanPath` directory recursively:

- `.ss`, participate in the full module system.
- `.gml`, treated as raw content, only usable via `include { "file.gml" }`.

---

## File Groups

Files are internally split into three groups:

| Group | Description |
|-------|-------------|
| `generate` | `.ss` files with an `intg` statement, these produce output |
| `scaff` | `.ss` files with `export` statements or plain `.ss` files |
| `normal` | `.gml` files |

---

## Processing Order

Order matters for dependency resolution:

1. Files with `export` statements, deepest directories first, so nested modules are resolved before their parents.
2. `index.ss` files, always processed last at each directory depth.
3. Files with `impl` statements, matched to their parent class after all exports are resolved.

---

## `index.ss` Behavior

- `index.ss` is always the last file processed in its directory.
- Its module store key is the **directory path** (not `dir/index`), so you import from the directory directly:

```ts
import { x } from "./dir"       // resolves to dir/index.ss
```

Use `index.ss` as your barrel file for re-exports and `intg` statements.

---

## Config Discovery

**ScaffScript** finds your config by walking up the directory tree from `process.cwd()`. The first matching config file found wins. This means you can run `scaff` from any subdirectory of your project and it will still pick up the config at the root.
