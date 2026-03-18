# Overview & Architecture

## What ScaffScript Does (Contributor Summary)

ScaffScript is a CLI tool that:
1. Reads `.ss` source files from a scan directory
2. Parses a custom module syntax layered on top of GML
3. Resolves cross-file dependencies into a flat in-memory module store
4. Generates `.gml` output files into a `.out/` staging directory
5. Writes those files into a real GameMaker project, creating/modifying `.yy` and `.yyp` files as needed

It does **not** transpile GML itself. GML code inside `.ss` files is passed through verbatim. **ScaffScript** only processes its own meta-syntax (`export`, `import`, `include`, `intg`, `#[...]`, `@decorators`).

---

## High-Level Pipeline

```
CLI args
  └─► parseArgs()                         [cli/args.ts]
        └─► getScaffConfig()              [fs/scan.ts]
        └─► getScaffFiles(scanPath)       [fs/scan.ts]
              └─► readAndSplitFiles()     [fs/grouping.ts]
                    │  ├─ parseSpecialValues()    [parser/special-value.ts]
                    │  └─ groups: {scaff, generate, normal}
                    │
                    └─► getExportedModules()      [parser/export-module.ts]
                          └─► ScaffModuleStore built
                                │
                                └─► implementClass()         [parser/class-implement.ts]
                                      └─► implementModules() x N files
                                                             [parser/import-module.ts]
                                                │
                                                └─► extractIntegrationData() x generate files
                                                                             [generator/extract.ts]
                                                      └─► generateSourceCode()
                                                                             [generator/write.ts]
                                                            └─► integrateSourceCodes()
                                                                             [integration/integrate.ts]
```

Each stage feeds the next. A fatal error (when `onNotFound: "error"`) short-circuits the chain and exits immediately, no partial writes.

---

## Module Boundaries

| Directory | Responsibility |
|-----------|----------------|
| `src/cli/` | Argument parsing, command dispatch, `init` template cloning (stubbed) |
| `src/fs/` | File discovery, config loading, file grouping into `ScaffFileGroup` |
| `src/parser/` | Export resolution, import/include implementation, class impl merging, special value substitution, regex definitions |
| `src/generator/` | Integration block extraction, `.gml` file writing, GM asset (`.yy`/`.yyp`) manipulation |
| `src/integration/` | Orchestrates writing generated files into the GM project, review loop |
| `src/runtime/` | Runtime detection, `RuntimeFS` adapter (Bun / Node.js) |
| `src/utils/` | Shared path, fs, log, and array helpers, no domain logic |
| `types/` | All shared TypeScript types, zero logic, zero imports from `src/` |

---

## Central Data Structure: `ScaffModuleStore`

```ts
type ScaffModuleStore = {
  [absoluteFilePath: string]: {
    [exportName: string]:
      | ScaffModuleConst
      | ScaffModuleFunction
      | ScaffModuleInterface
      | ScaffModuleType
      | ScaffModuleVar
      | ScaffModuleDefault
  }
}
```

Built once by `getExportedModules()`, then **mutated in-place** throughout the pipeline:
- `implementModules()` writes re-exported entries under new path keys.
- Alias imports write a `@AliasName` shadow key alongside the original name key.
- `implementClass()` appends `impl` block body directly into the parent class's `parsedStr`.

There is no immutable/copy-on-write pattern. The store is passed by reference to every stage.

---

## Key Design Decisions

### Why regex-based parsing instead of a real parser?
The `.ss` syntax is intentionally constrained. Exports are always top-level, integration blocks always start at column 0, directives are single-line. This regularity makes regex reliable enough. A parser generator would add toolchain complexity with no meaningful benefit for the current feature scope.

Known limitation: the regex approach breaks on certain edge cases (e.g. `export` keyword inside a string literal at the start of a line, deeply nested brace counting for multiline constructs). These are tracked as known issues.

### Why in-memory store instead of AST?
**ScaffScript** only needs top-level declarations and specific directive lines, not a full expression tree. A flat `Record<path, Record<name, module>>` is sufficient and trivial to look up and mutate. An AST would add significant complexity for no practical gain at this scale.

### Why `.out/` staging instead of writing directly?
Staging decouples generation from integration, makes output inspectable without touching the GM project (`noIntegration: true`), and provides a paper trail for debugging. It also allows the integration step to diff against the staging output.

### Why support both Bun and Node.js?
Bun is significantly faster (file I/O, no cold-start overhead), but Node.js is the universal baseline. The `RuntimeFS` abstraction keeps all other code runtime-agnostic. Detection is zero-cost: `typeof Bun !== "undefined"`.

### Why mutate `ScaffFile.content` in place?
Each processing stage (special values, import resolution, include inlining) transforms file content progressively. Mutating in place avoids copying large strings repeatedly and keeps the pipeline straightforward. The trade-off is that stages are order-dependent and you can't re-run a stage on the original content.
