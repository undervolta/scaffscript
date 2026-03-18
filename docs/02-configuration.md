# Configuration

ScaffScript looks for a config file starting from your working directory, walking up the tree. Supported filenames in search order:

```
scaff.config.ts
scaff.config.mjs
scaff.config.js
scaff.config.cjs
scaff.config.json
```

All fields are optional and fall back to defaults.

---

## Example Config

```ts
// scaff.config.ts

export default {
  acceptAllIntegrations: false,
  clearOutputDir: true,
  debugLevel: 0,
  integrationOption: {
    isDnd: false
  },
  noBackup: false,
  noIntegration: false,
  production: false,
  path: {
    "@scr1": "./script1"
  },
  targetPlatform: "all",
  useGmAssetPath: true
};
```

---

## Fields Reference

### `acceptAllIntegrations`
**Type:** `boolean` | **Default:** `false`

When `false`, ScaffScript prompts you after integration to confirm or revert each file. When `true`, all generated files are written without confirmation. Use with caution.

---

### `clearOutputDir`
**Type:** `boolean` | **Default:** `false`

If `true`, the `.out/` directory is deleted before each generation run. Useful to avoid stale files accumulating.

---

### `counterStart`
**Type:** `number` | **Default:** `1`

Starting value for the `@counter` directive. Increments by 1 each time `@counter` is encountered during file processing.

---

### `debugLevel`
**Type:** `0 | 1 | 2` | **Default:** `0`

Controls console output verbosity:
- `0` -> `[INFO]`, `[WARN]`, `[ERROR]` only.
- `1` -> adds `[DEBUG]` messages for key steps.
- `2` -> verbose mode, for development purposes only.

---

### `integrationOption`
**Type:** `Partial<{ isDnd: boolean }>` | **Default:** `{}`

Options passed to GameMaker asset creation. Currently supports:
- `isDnd` -> sets the `isDnD` flag in generated `.yy` files (default: `false`).

---

### `noBackup`
**Type:** `boolean` | **Default:** `false`

If `true`, ScaffScript will **not** read the existing content of a target `.gml` file before overwriting it. This disables the backup/restore prompt during the review step.

---

### `noIntegration`
**Type:** `boolean` | **Default:** `false`

If `true`, skips the integration step. Output is generated to `.out/` only, nothing is written to the GM project. Useful for previewing output.

---

### `onNotFound`
**Type:** `"error" | "ignore"` | **Default:** `"error"`

What to do when a referenced module, class, file, or integration target can't be found:

- `"error"` -> logs an error and aborts the entire run.
- `"ignore"` -> logs a warning and skips the missing reference, continuing the run.

---

### `path`
**Type:** `Record<string, string>` | **Default:** `{}`

Path alias map for `import` / `include` / `export` statements. Keys are the alias strings used in source files, values are relative paths resolved from the importing file.

**Example:**

```ts
path: {
  "@scr1": "./script1"
}
```

Then in a `.ss` file:

```js
include { y, z } from "@scr1"
```

This resolves to `./script1` relative to the importing file.

---

### `production`
**Type:** `boolean` | **Default:** `false`

Enables production mode for integration block filtering:
- `true` -> integration blocks with `--dev` or `--development` flags are removed.
- `false` -> integration blocks with `--prod` or `--production` flags are removed.

---

### `tabType`
**Type:** `"1t" | "2s" | "4s"` | **Default:** `"1t"`

Indentation style used in generated GML output:
- `"1t"` -> 1 tab character (`\t`).
- `"2s"` -> 2 spaces.
- `"4s"` -> 4 spaces.

---

### `targetPlatform`
**Type:** `ScaffIntegrationTargetPlatform` | **Default:** `"all"`

Platform target for tree-shaking integration blocks. Only blocks matching this platform (or flagged `all`) are included. Blocks with an exclusion flag for this platform (e.g. `!windows`) are removed.

Supported values:
```
"all" | "android" | "gxgames" | "html5" | "ios" | "linux" | "mac" | "ps4" | "ps5" | "reddit" | "switch" | "switch2" | "tvos" | "ubuntu" | "windows" | "xboxone" | "xboxseries"
```

---

### `useGmAssetPath`
**Type:** `boolean` | **Default:** `false`

When `true`, uses standard GameMaker asset folder structure for integration:
- Paths under `scripts/` are treated as script assets.
- Paths under `objects/` generate per-event `.gml` files.

When `false`, all output is written as flat script files. Most projects should set this to `true`.
