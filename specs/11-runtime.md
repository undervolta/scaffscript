# Runtime Abstraction

## Source: `src/runtime/`

---

## Detection - `detect.ts`

```ts
export const runtime = (typeof Bun !== "undefined") ? "bun" : "node";
```

Evaluated at module load time. `typeof Bun` is `"object"` under Bun, `"undefined"` under Node.js.

## Adapter Selection - `adapter.ts`

```ts
export const fsRuntime = (runtime === "bun") ? BunRuntime : NodeRuntime;
```

`fsRuntime` is the single import used by all code that needs I/O. Nothing in the codebase imports `BunRuntime` or `NodeRuntime` directly.

---

## `RuntimeFS` Interface

```ts
interface RuntimeFS {
  readText(path: string): Promise<string>;
  writeText(path: string, data: string): Promise<void>;
  delete(path: string): Promise<void>;
  prompt(message: string): Promise<string>;
}
```

All methods are async. Callers always `await` them.

---

## Implementation Notes

### Bun (`bun.ts`)

| Method | Implementation |
|--------|---------------|
| `readText` | `Bun.file(path).text()` |
| `writeText` | `Bun.write(path, data)`, Bun auto-creates parent dirs |
| `delete` | `Bun.file(path).delete()` |
| `prompt` | `prompt(message)`, Bun's global synchronous prompt (returns `string \| null`, coerced with `?? ""`) |

### Node.js (`node.ts`)

Uses lazy `ensureModules()` to defer `import("fs/promises")` and `import("readline/promises")` until first use. This avoids paying the dynamic import cost at startup.

| Method | Implementation |
|--------|---------------|
| `readText` | `fs.readFile(path, "utf8")` |
| `writeText` | `fs.mkdir(dirname(path), { recursive: true })` -> `fs.writeFile(path, data, "utf8")` |
| `delete` | `fs.unlink(path)` |
| `prompt` | `readline.createInterface(stdin, stdout)` -> `rl.question(message + " ")` -> `rl.close()` |

**Design note:** `writeText` on Node explicitly creates parent directories before writing. Bun's `Bun.write` does this implicitly. The behavior is equivalent from the caller's perspective.

---

## Adding a New Runtime

To add a third runtime (e.g. Deno):
1. Create `src/runtime/deno.ts` implementing `RuntimeFS`
2. Update `detect.ts` to return `"deno"` when detected
3. Update `adapter.ts` to select `DenoRuntime`

No other files need changes. All I/O goes through `fsRuntime`.

---

## `utils/fs.ts` - Static File Utilities

These are **not** part of `RuntimeFS`. They use Node's `fs/promises` directly and are not runtime-abstracted:

```ts
fileExists(path): Promise<boolean>
clearOutDir(): Promise<void>
deleteDir(target, root): Promise<void>
```

`fileExists` has a special case for Bun (`Bun.file(path).exists()`) inline in the function body. It's not routed through `fsRuntime`. This is an inconsistency worth noting: if a new runtime is added, `fileExists` also needs updating.

`deleteDir` includes safety checks to prevent deleting outside the root path:

- Checks `rel.startsWith("..")` — rejects paths that escape the root via `../`.
- Checks `isAbsolute(rel)` — rejects absolute path escapes.
- Checks `resolvedTarget === resolvedRoot` — prevents deleting the root itself.
