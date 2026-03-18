# ScaffScript

ScaffScript is a **superset of GML (GameMaker Language)** that adds a TypeScript-like module system. Write organized, modular GML in `.ss` files. ScaffScript compiles and injects it directly into your GameMaker project.

**Write GML like TypeScript. Ship as an actual GML.**

> Version `0.1.2` - MIT License

**DISCLAIMER**

> ScaffScript is **not** affiliated with or endorsed by YoYo Games Ltd. GameMaker and GML are trademarks of YoYo Games Ltd. 

---

## Installation

Globall installation:

```bash
npm install -g scaffscript

# or with bun (recommended, faster)
bun add -g scaffscript
```

Local installation:

```bash
npm install scaffscript

# or with bun
bun add scaffscript
```

---

## Project Structure

```
your-project/
├── src/                your .ss source files
├── scaff.config.cjs    ScaffScript config
├── package.json
└── your-game/
    ├── your-game.yyp   target GameMaker project
    └── ...             other GameMaker files
```

```
your-project/
├── datafiles/
├── objects/
├── options/
├── rooms/
├── scripts/
├── sprites/
├── src/                your .ss source files
├── .gitattributes
├── .gitignore
├── package.json
├── scaff.config.cjs    ScaffScript config
├── your-game.resource_order
└── your-game.yyp       target GameMaker project  
```

You can choose to use either structure, wrapping your GameMaker project inside your project directory, or having it side-by-side. 

---

## Usage

If installed globally:

```bash
scaff gen ./src to ./your-game/your-game.yyp
scaff --help
```

If installed locally:

```bash
npx scaff gen ./src to ./your-game/your-game.yyp
npx scaff --help

bunx scaff gen ./src to ./your-game/your-game.yyp
bunx scaff --help
```

---

## How It Works

1. ScaffScript scans your source directory for `*.ss` and `*.gml` files.
2. Resolves all `export` / `import` / `include` references across files.
3. Reads intg statements to know which blocks go to which GM asset.
4. Generates `.gml` output and writes it directly into your GameMaker project.
5. Creates new scripts/objects in your `.yyp` automatically if they don't exist yet.

---

## File Types

| Extension | Description |
|-----------|-------------|
| `.ss` | ScaffScript source, supports the full module system |
| `.gml` | Standard GML, can be included as raw content via `include` |

---

## Supported Runtimes

ScaffScript runs on both `Node.js` and `Bun`. `Bun` is recommended for speed. Runtime is auto-detected.
