# CLI Reference

```bash
scaff <command> [args]
```

---

## Commands

### `gen` / `generate`

Runs the full pipeline (scan, parse, generate, integrate).

```bash
scaff gen <source_path> to <project_path>
scaff generate <source_path> to <project_path>
```

| Argument | Description |
|----------|-------------|
| `source_path` | Directory to scan for `.ss` and `.gml` files. |
| `to` | Required literal keyword between the two paths. |
| `project_path` | Path to your GameMaker `.yyp` project file. |

The `project_path` must end in `.yyp` and must exist on disk.

```bash
scaff gen ./src to ./my-game/my-game.yyp
```

---

### `init`

> **Not implemented yet.** Prints an info message and exits.

Will initialize a new ScaffScript project from a template.

```bash
scaff init <target_path> [options]
```

| Flag | Description |
|------|-------------|
| `-t=<template>`, `--template=<template>` | Template: `bun`, `pnpm`, or `npm` (default: `npm`). |
| `--git` | Initialize a Git repository. |
| `--new` | Also create a new GameMaker project. |

---

### `help` / `-h` / `--help`

Prints usage information.

```bash
scaff help
scaff -h
scaff --help
```

---

## Console Output

| Tag | Color | Meaning |
|-----|-------|---------|
| `[DEBUG]` | Gray | Step tracing (only when `debugLevel >= 1`) |
| `[INFO]` | Cyan | Progress and success messages |
| `[WARN]` | Yellow | Non-fatal issues, skipped items |
| `[ERROR]` | Red | Fatal issues that abort the run |
| `[INPUT]` | Magenta | Prompt during the integration review step |
