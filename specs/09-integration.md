# Integration Orchestration & Review Loop

## Source: `src/integration/integrate.ts`

---

## `integrateSourceCodes(genFile, config, projectPath)`

Takes the `ScaffIntegrationStore` from `generateSourceCode()` and writes the final files into the GM project. Also handles the interactive review loop when `acceptAllIntegration: false`.

### Return Values

| Value | Meaning |
|-------|---------|
| `null` | Fatal error (invalid project path, etc.), caller should abort |
| `0` | No files to integrate (empty store) |
| `> 0` | Number of files successfully integrated |

---

## Write Phase

Iterates `integrations` in batches of 10 via `Promise.all`:

1. Check if the target file exists in the GM project via `fileExists(path)`.
2. If **not exists** -> call `createGMResource()`, collect new folder/resource strings into `newFolders[]` / `newResources[]`, set `data.isNew = true`.
3. Apply `toRemoves`: for each body in `data.toRemoves`, `data.content.replace(body, "")` then `.trim() + "\n"`.
4. Write `data.content` to `path` via `fsRuntime.writeText()`.

After the batch loop, if any new folders/resources were collected:

```ts
await modifyYyProject("add", projectPath, newResources, newFolders);
```

**Note:** `modifyYyProject` is called **once** after all writes, not per-file. This is important because the `.yyp` file is read once per `modifyYyProject` call.

---

## Review Loop (`acceptAllIntegration: false`)

After all writes, iterates over `integrations` again (not batched, sequential, user-driven):

### Pre-existing file (has backup)

```
[INPUT]  Revert file Create_0.gml from oSystem? (y/N) ->
```

- `y` -> `fsRuntime.writeText(path, data.backup)`, `intgCnt--`.
- `n` (default) -> no action.

### New file (no backup)

```
[INPUT]  Remove file scMyScript.gml from scMyScript? (y/N) ->
```

- `y` -> `removeGMResource(path, projectScanPath, data)`, `intgCnt--`, collect removed resource into `deleteResources[]`.
- `n` -> no action.

### After review loop

If any resources were removed:

```ts
await modifyYyProject("remove", projectPath, deleteResources);
```

The `deleteResources` format is `"${type},${name},${dirPath}"`, a comma-separated string (not an object). This is parsed in `modifyYyProject` with `resc.split(",")`.

---

## `intgCnt` Tracking

`intgCnt` starts at 0, increments for each file written in the write phase, decrements for each revert/remove in the review phase. The final value is logged and returned.

**Edge case:** `intgCnt` can go negative if more files are reverted than were counted (shouldn't happen normally, but no bounds check exists).

---

## Event Prompt Formatting

For object event files, the prompt uses a formatted event name:

```ts
`${data.event.name}${data.event.numStr ? `\x1b[0m:\x1b[36m${data.event.numStr}` : ""} Event`
```

e.g. `Keyboard:KEYBOARD_F5 Event` or `Create Event`. The ANSI color codes are embedded in the prompt string. This assumes the terminal supports ANSI.

---

## Design Note: Why Write-Then-Review?

The write phase runs first, then review. This means files are **already written to the GM project** by the time the user is asked to confirm or revert. The review loop is a *post-write undo* step, not a pre-write approval gate.

Rationale: this lets the user open GameMaker IDE, click **Reload** button, and see the changes live while reviewing. The `acceptAllIntegration: true` mode simply skips the undo step entirely.

Trade-off: if the process is killed mid-review, some files may be written while others are not, leaving the project in a partial state with no way to auto-revert.
