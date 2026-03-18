# Integration Block Extraction

## Source: `src/generator/extract.ts`

---

## Purpose

`extractIntegrationData()` parses the two ScaffScript code generation constructs from a generate-group file:

- `#[blockName ...]`, named content blocks.
- `intg <targets> to "<path>"`, statements that map blocks to GM asset paths.

It produces an array of `ScaffIntegration` objects that `generateSourceCode()` then writes to disk.

---

## Two-Phase Parsing

### Phase 1: Block Collection (via `intgBlockRegex`)

```ts
/#\[(?<name>[^\]]+)\](?<body>[\s\S]*?(?=\n?#\[[^\]]+\]|$))/g
```

Each match captures:
- `name`, the full header string (everything between `[` and `]`).
- `body`, all content until the next `#[` header or end of file.

The header string is split on `--` to separate the name/event part from flags:

```ts
const flags = header.split("--")[1]?.split(" ").map(f => f.trim()) ?? [];

const headerSplit = header.split("--")[0].split("as").map(...);
```

The `as` keyword in the name part designates an event target:
- `#[objCreate as create]` -> name = `"objcreate"`, eventType = `"create"`.
- `#[keydown:keyboard_f5 Event]` -> name = `"keydown:keyboard_f5"`, eventType = `"keydown:keyboard_f5"` (the `Event`/`ev` suffix triggers event resolution, case insensitive).
- `#[main]` -> name = `"main"`, no event.

All names are lowercased via `.toLowerCase()`, except collision object names (which preserve case for the GM object reference).

### Phase 2: Block Merging

Blocks with the same name are merged:

```ts
existsBlock.body += (existsBlock.body !== "" ? "\n\n" : "") + processedBody;
```

The `blocks[]` array accumulates merged blocks. This happens before `intg` statements are processed.

---

## Flag Processing

Flags empty `processedBody` (set to `""`) under these conditions:

| Flag | Empties when |
|------|-------------|
| `debug` | `config.debugLevel >= 1` |
| `dev` / `development` | `config.production === true` |
| `prod` / `production` | `config.production === false` |
| `skip` / `disabled` | always |
| `!<platform>` | `config.targetPlatform === platform` |
| `<platform>` (non-exclusion) | `config.targetPlatform !== "all"` AND platform flag not present AND `all` flag not present |

**Order:** Flag checks run sequentially. An early empty doesn't prevent subsequent checks from also running (they just operate on an already-empty string, which is fine).

**`exclude` flag:** Does not empty the body. Instead, `processedBody` is added to `block.removeBodies[]`. These are stripped from the final output after integration (see `integrate.ts`).

---

## Event Resolution — `getEventFile()`

Converts event type/arg strings to a `GMEvent` object. Maps event keywords to `EVENT_TYPE` enum values, determines `needNum` (whether a numeric/string arg is required), and builds the output filename.

```ts
type GMEvent = {
  type: EVENT_TYPE | null;
  needNum: boolean;
  dynamicNum: boolean;    // true for collision (object name, not a number)
  num: number | null;     // the EVENT enum value
  numStr: string | null;  // the raw arg string (uppercased for non-collision)
  name: string | null;    // EventName[type] (e.g. "Create", "Keyboard")
  fileName: string | null; // e.g. "Create_0", "Keyboard_116"
  collObj: string | null;  // JSON-like string for collision object ref in .yy
}
```

For keyboard/step/alarm/etc., `numStr` is uppercased and looked up in the `EVENT` const enum. For collision, the raw object name is used as-is for both `numStr` and `collObj`.

**Error cases:**
- Unknown event type -> `type: null` -> logged + skipped/aborted.
- Known event type but `numStr` not found in `EVENT` (and `needNum: true`) -> `num: null` -> logged + skipped/aborted.

---

## `intg` Statement Processing (via `intgRegex`)

```ts
/intg\s+(?<targets>\*|\{[^}]+\}|[A-Za-z0-9_]+)\s+to\s+(?<path>["'][^"']+["'])\s*;?/g
```

For each match:
1. Path is unquoted, resolved, normalized, and `.gml` extension stripped:

   ```ts
   const targetPath = normalizePath(resolvePath(path.slice(1, -1))).replace(".gml", "");
   ```

2. A new `ScaffIntegration` object is pushed to `res[]`.

3. Targets are matched against `blocks[]` by name.

**Wildcard (`*`):** Pushes all blocks directly.
**Named targets:** Each name is looked up in `blocks[]`. If not found -> trigger `onNotFound` behavior.

---

## Output Shape

```ts
type ScaffIntegration = {
  path: string;                    // resolved target path (no .gml)
  targets: ScaffIntegrationBlock[]; // the matched blocks
  backup: string | null;           // populated later by generateSourceCode()
  content: { [intgPath: string]: string }; // populated by generateSourceCode()
}
```

Returns `null` if any fatal error occurred (when `onNotFound: "error"`). Returns `[]` (empty array) if the file has no valid `intg` statements.

---

## Edge Cases

- A single file can have multiple `intg` statements targeting different paths. Each produces a separate `ScaffIntegration` entry in the result.
- Block names in `intg { ... }` are case-sensitive as written, but block headers are lowercased. The lookup `blocks.find(b => b.name === target.toLowerCase())` lowercases the `intg` target too, so effectively case-insensitive matching.
- The `intgBlockRegex` body capture is non-greedy and anchored to the next `#[` or EOF. A `#[` that appears inside a GML string in the block body would prematurely end the block capture. This is a known limitation.
