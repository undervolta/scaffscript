# Processing Flow and Runtime Pipeline

## 1. End-to-End Flow

The main execution path for `generate` follows this exact sequence:

1. Parse CLI arguments.
2. Load ScaffScript config.
3. Scan source files.
4. Read files and classify them.
5. Build the exported module store.
6. Apply `impl` blocks to class exports.
7. Re-export modules where needed.
8. Implement imports/includes inside each source file.
9. Extract integration data from generation targets.
10. Generate `.gml` output files into `.out/`.
11. Optionally integrate generated output into a GameMaker project.

This order matters. Several later steps assume earlier phases have already mutated file content or populated shared lookup structures.

## 2. CLI Parsing

[`src/cli/args.ts`](../src/cli/args.ts) currently supports:

1. `generate` / `gen`
2. `help`

For `generate`, the parser:

1. Requires a `.yyp` path as the second argument.
2. Accepts `-i` / `--integrate` to force integration.
3. Accepts `-!i` / `--no-integration` to disable integration.
4. Rejects conflicting integration flags.
5. Validates that the target `.yyp` file exists.

## 3. Config Discovery and Defaults

[`src/fs/scan.ts`](../src/fs/scan.ts) searches upward from `process.cwd()` for config files in this order:

1. `scaff.config.ts`
2. `scaff.config.mjs`
3. `scaff.config.js`
4. `scaff.config.cjs`
5. `scaff.config.json`

If no dedicated config is found, it falls back to `package.json` and reads the `scaff` field.

The returned config is fully defaulted in code. Contributors adding new config flags should update:

1. The `ScaffConfig` type in [`types/scaff.ts`](../types/scaff.ts)
2. The defaulting logic in [`src/fs/scan.ts`](../src/fs/scan.ts)
3. Any dependent subsystems that assume the new value exists

## 4. File Scanning Rules

The scanner:

1. Recursively traverses the configured source directory.
2. Includes only `.ss` and `.gml` files.
3. Ignores files whose names start with `_`.
4. Ignores directories whose path segments start with `_`.

The discovered record is converted into `ScaffFile`, which is the shared mutable file model used across the pipeline.

## 5. File Reading and Grouping

[`src/fs/grouping.ts`](../src/fs/grouping.ts) performs several jobs at once:

1. Reads file contents.
2. Normalizes line endings to `\n`.
3. Detects whether a file contains generation statements (`intg ... to ...`).
4. Rewrites `.ss` file content using special values.
5. Renames `.ss` file records by stripping the `.ss` extension.
6. Detects `index.ss` and delays those files so they are processed later.
7. Detects exports and `impl` usage to decide processing order and parent-child relationships.

The output is a `ScaffFileGroup`:

1. `scaff`: regular ScaffScript files.
2. `generate`: ScaffScript files with integration generation targets.
3. `normal`: plain `.gml` files.

## 6. Why Grouping Order Matters

Grouping is not just organization. It establishes later behavior:

1. Export-heavy files are sorted by path depth so deeper modules are processed first.
2. `index` files are postponed, which makes them act closer to re-export aggregators.
3. `impl` files are attached to their parent class file through `childs`.
4. Missing `impl` targets can abort the run or be downgraded to warnings based on `onNotFound`.

If contributors change grouping rules, they should assume module resolution and class implementation may change in non-obvious ways.

## 7. Runtime Abstraction Flow

The runtime abstraction is intentionally tiny:

1. Detect Bun vs Node in [`src/runtime/detect.ts`](../src/runtime/detect.ts)
2. Select the adapter in [`src/runtime/adapter.ts`](../src/runtime/adapter.ts)
3. Use `fsRuntime` everywhere else

The adapter only exposes:

1. `readText`
2. `writeText`
3. `delete`
4. `prompt`

This keeps most subsystems runtime-agnostic, but it also means advanced FS behavior is reimplemented locally in helpers rather than delegated to a richer abstraction.

## 8. Failure and Abort Behavior

The pipeline uses mixed failure semantics:

1. Some phases return `null` to signal hard failure.
2. Some phases return empty objects and log errors.
3. Some conditions are warnings when `onNotFound === "ignore"` and fatal when `onNotFound === "error"`.

Contributors should preserve this pattern carefully when extending the flow. A silent `continue` in the wrong place can create partially generated output that looks valid but is semantically wrong.
