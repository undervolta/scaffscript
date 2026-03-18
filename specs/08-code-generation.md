# Code Generation & GM Asset Management

## Sources: `src/generator/write.ts`, `src/generator/gm-asset.ts`

---

## `generateSourceCode(intgData, config, projectPath)`

Iterates over `ScaffIntegration[]` and writes each target to `.out/` (staging directory). Returns a `ScaffIntegrationStore` keyed by the **final GM project path** (not the `.out/` path).

### Path Computation

```ts
let genPath = data.path.replace(commonPath([resolvePath("./out"), data.path]) ?? "", "");

const outFile = normalizePath(resolvePath(`./.out${genPath}.gml`));
```

`commonPath()` strips the shared prefix between `.out/` and the target path, leaving a relative path suffix. If `genPath` ends up as `""` (paths are identical), it's treated as an error.

### Two Output Modes (controlled by `useGmAssetPath`)

#### Script Mode (`useGmAssetPath: false` or path doesn't contain `objects/`)

All blocks are concatenated into a single body string with blank-line separators, then written to `outFile`. The write path in the GM project is computed as:

```ts
`${projectDir}/scripts/${scriptName}/${scriptName}.gml`
```

#### Object/Event Mode (`useGmAssetPath: true` and path contains `objects/`)

Each block with an associated `event` gets its **own file**:

```ts
const eventFile = `./.out${genPath}/${target.event.fileName}.gml`

const writePath = `${projectDir}/objects/${objName}/${outFileName}`
```

Blocks without an event are concatenated into a fallback body. But note this body is written to `.out/` only and **not** added to `ScaffIntegrationStore` (it won't be integrated). This is the intended behavior for non-event blocks in object mode.

### Backup

For each write path, if the target file already exists in the GM project:

```ts
target.backup = await fsRuntime.readText(writePath);
res[writePath].backup = target.backup;
```

This backup string is used by the review loop in `integrateSourceCodes()`.

### `ScaffIntegrationStore` Entry Shape

```ts
type ScaffIntegrationSummary = {
  fullPath: string;     // path in .out/ staging dir
  dirPath: string;      // folder path within the GM asset type dir (for .yyp folder registration)
  content: string;      // the generated GML content
  backup: string | null;
  isNew: boolean;       // true after .yy is created (set by integrate.ts)
  event: GMEvent | null;
  toRemoves: string[];  // bodies from `exclude` -flagged blocks
}
```

---

## GM Asset Creation — `createGMResource()`

Called by `integrateSourceCodes()` for paths that don't yet exist in the GM project.

### Scripts
Creates a `.yy` file at `scripts/<name>/<name>.yy` with the `GMScript` JSON-like structure. Parent folder path is derived from `intgContent.dirPath`.

### Objects
If the `.yy` doesn't exist: creates it with a full `GMObject` JSON-like structure including the event list populated from `intgContent.event`.

If the `.yy` already exists: reads it, finds the `eventList` array, checks for duplicate event (matching `eventType` + `eventNum`), and appends the new event entry if not already present.

### `.yy` JSON Format

GameMaker's `.yy` files use a non-standard JSON format with trailing commas. `stripTrailingCommas()` handles this before `JSON.parse()`:

```ts
export function parseGMJson<T>(raw: string): T {
  const validJson = stripTrailingCommas(raw);
  return JSON.parse(validJson) as T;
}
```

`stripTrailingCommas()` is a character-level parser (not regex) that skips string contents and removes commas immediately followed by `}` or `]`.

---

## `.yyp` Project File Modification - `modifyYyProject()`

Modifies the raw `.yyp` text in-place using line-based operations (not JSON parse/serialize — the file is too large and format-sensitive).

### `"add"` mode

**Folder entries:** Finds the `Folders` array, then for each folder path in `toAddFolders`, builds intermediate paths and inserts `createGMFolderStr()` entries for any that don't already exist. Uses a sequential insert with a running offset counter (`addedFolderCnt`) to account for lines added above.

**Resource entries:** Finds the `resources` array, checks for duplicates by name, inserts `createGMResourceStr()` for new ones.

### `"remove"` mode

Finds resource entries by name and splices them out of `rawLines`. Updates `rescEndIdx` after each removal to keep the range valid.

**Design note:** Folder entries are **not** removed when removing resources. Orphaned folders in the `.yyp` are harmless in GameMaker and cleaning them up is complex (would require checking if any resource still references the folder).

---

## `removeGMResource()`

Called during the review loop when the user declines a new file. Deletes both the `.gml` and `.yy` files. For objects, also handles removing the specific event entry from an existing `.yy` (if the object already existed before ScaffScript added the event).

Uses `deleteDir()` to clean up empty parent directories, bounded by the scan root path to prevent accidental deletion outside the project.

---

## Edge Cases & Known Limitations

- **`commonPath()` returning `null`:** If `intgData` has a target path that shares no prefix with `./out`, `genPath` becomes the full path. This would produce a deeply nested `.out/` structure. Currently handled with an error check for empty `genPath`, but unusual absolute paths could still misbehave.
- **Object event deduplication** uses string comparison on `eventType` and `eventNum` extracted from raw `.yy` line text (not parsed JSON). Format changes in GM IDE output could break this matching.
- **Concurrent writes:** `Promise.all` is used in `integrateSourceCodes()` for the write batch. If two `intg` statements target the same file, both writes may race. This scenario is not currently detected or prevented.
