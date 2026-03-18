# Configuration System

## Sources: `src/fs/scan.ts`

---

## Config Resolution Order

`getScaffConfig()` walks up the directory tree from `process.cwd()` using `findConfig()`, searching for these filenames in order:

```
scaff.config.ts
scaff.config.mjs
scaff.config.js
scaff.config.cjs
scaff.config.json
```

`findConfig()` resolves each candidate with `path.join(dir, filename)`, checks existence, then moves to `dirname(dir)`. It stops when a file is found or when `dirname(dir) === dir` (filesystem root reached).

If no config file is found, it falls back to `package.json` and reads the `scaff` key (legacy/fallback path, not documented as primary usage).

**Loading strategy per extension:**
- `.cjs` / `.json` → `require(confPath)` (sync CJS).
- Everything else → `import(pathToFileURL(confPath).href)` (dynamic ESM import), reads `mod.default ?? mod`.

**Design note:** The upward walk means **ScaffScript** can be run from any subdirectory of a project and still find the config. This mirrors how tools like ESLint/TSConfig resolution works.

---

## `ScaffConfig` Type - Full Reference

```ts
type ScaffConfig = {
  acceptAllIntegration: boolean;          // default: false
  clearOutputDir: boolean;               // default: false
  counterStart: number;                  // default: 1
  debugLevel: 0 | 1 | 2;               // default: 0
  integrationOption: ScaffIntegrationOptions;  // default: {}
  noBackup: boolean;                     // default: false
  noIntegration: boolean;               // default: false
  onNotFound: "error" | "ignore";       // default: "error"
  path: Record<string, string>;         // default: {}
  production: boolean;                  // default: false
  tabType: "1t" | "2s" | "4s";        // default: "1t"
  targetPlatform: ScaffIntegrationTargetPlatform;  // default: "all"
  useGmAssetPath: boolean;             // default: false
};
```

All fields are applied with `conf.field ?? defaultValue` — missing fields always fall back to their defaults. Config is always a complete `ScaffConfig` object after `getScaffConfig()` returns. Consumers never need to handle `undefined`.

---

## How Config Flows Through the Pipeline

The config object is passed explicitly as a parameter to every major function:

```
getScaffConfig()
  └─ readAndSplitFiles(files, config)
  └─ getExportedModules(fileGroup, config)
  └─ implementClass(module, fileGroup, config)
  └─ implementModules(module, fileGroup, file, config)
  └─ extractIntegrationData(file, config)
  └─ generateSourceCode(intgData, config, projectPath)
  └─ integrateSourceCodes(genFiles, config, projectPath)
```

There is no global config singleton, it's threaded through explicitly. This makes it easy to test individual stages with custom config overrides.

---

## Fields That Affect Pipeline Behavior

### `onNotFound`
Acts as a global error tolerance switch. Every "not found" scenario (missing module, missing class for `impl`, missing integration target, missing file for `include`) checks this flag:
- `"error"` -> `log.error()` + `return null` (aborts the stage, propagates up to `main()`)
- `"ignore"` -> `log.warn()` + `continue`/`return res` (skips the item, continues)

### `debugLevel`
- `0` -> only `[INFO]`/`[WARN]`/`[ERROR]`
- `1` -> adds `[DEBUG]` at key decision points (module found, block detected, integration target matched)
- `2` -> intended for verbose content dumps (partially implemented, some `log.debug` calls with file content are commented out)

### `path`
Path alias map used in `getModuleUsage()`. When resolving an `import`/`include`/`export ... from "..."` path string, the resolver checks `config.path[rawPath] ?? rawPath`. The full key string from config (e.g. `"@scr1"`) must match the exact import path string (without quotes).

### `tabType`
Used in two places:
1. `insertTabs()` in `export-module.ts`, indents class body when building `parsedStr`
2. `getTabLevels()` + `countTabsBeforeSubstring()` in `import-module.ts`, re-indents `@content` injections to match the surrounding context

### `useGmAssetPath`
Switches the output path strategy in `generateSourceCode()`:
- `true` -> split objects into per-event files, scripts into `scripts/<name>/<name>.gml` structure
- `false` -> flat output, all blocks concatenated into a single file per `intg` target

### `targetPlatform` + `production`
Both are block-filtering flags evaluated in `extractIntegrationData()` per integration block. They empty `processedBody` (set to `""`) for excluded blocks, which means the block exists in the data structure but contributes no content to the output.

---

## Edge Cases

- If both `scaff.config.ts` and `package.json#scaff` exist, the config file wins. The `package.json` fallback only runs when `confPath` is still `null` after the file search loop.
- Dynamic `import()` of a `.ts` config file only works under Bun (which natively handles TypeScript). Under Node.js, users need to use `.js`/`.mjs`/`.cjs` or `scaff.config.json`.
- `counterStart` is loaded into a mutable `{ count: number }` object in `readAndSplitFiles()` and passed by reference to `parseSpecialValues()`. The counter is shared across all files processed in a single run.
