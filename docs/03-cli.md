# CLI Reference

```bash
scaff <command> [args]
```

---

## Commands

### `gen` / `generate`

Runs the full pipeline (scan, parse, generate, integrate).

```bash
scaff gen <source_path> <project_path>
scaff generate <source_path> <project_path>
```

| Argument | Description |
|----------|-------------|
| `source_path` | Directory to scan for `.ss` and `.gml` files. |
| `project_path` | Path to your GameMaker `.yyp` project file. |

The `project_path` must end in `.yyp` and must exist on disk.

```bash
scaff generate ./src ./my-game/my-game.yyp  # wrapped gm project
scaff gen ./src ./my-game.yyp               # inline gm project
```

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
