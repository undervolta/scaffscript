# ScaffScript

ScaffScript is a **superset of GML (GameMaker Language)** that adds a TypeScript-like module system. Write organized, modular GML in `.ss` files. ScaffScript compiles and injects it directly into your GameMaker project.

**Write GML like TypeScript. Ship as an actual GML.**

> Version `0.1.2` - MIT License

**DISCLAIMER**

> ScaffScript is **not** affiliated with or endorsed by YoYo Games Ltd. GameMaker and GML are trademarks of YoYo Games Ltd. 

---

## Project Initialization

```bash
# using bun (recommended, faster)
bun create @scaffscript/project@latest

# using pnpm
pnpm create @scaffscript/project@latest

# using npm, for compatibility
npm create @scaffscript/project@latest
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

### Syntax

```bash
scaff <command> [args]
```

You can choose to using it by direct execution, or by package link.

### Direct Execution

```bash
# using bun
bunx scaff gen ./src ./your-game/your-game.yyp
bunx scaff --help

bun run scaff -- gen ./src ./your-game/your-game.yyp
bun run scaff -- help

# using pnpm
pnpm exec scaff gen ./src ./your-game/your-game.yyp
pnpm exec scaff --help

pnpm run scaff -- gen ./src ./your-game/your-game.yyp
pnpm run scaff -- help

# using npm
npx scaff gen ./src ./your-game/your-game.yyp
npx scaff --help

npm run scaff -- gen ./src ./your-game/your-game.yyp
npm run scaff -- help
```

### Using Scripts

Add and edit scripts in your `package.json` file:

```json
{
	"scripts": {
		"generate": "scaff gen ./src ./your-game/your-game.yyp",
		"help": "scaff help"
	}
}
```

Then you can run it via:

```bash
bun run generate
bun run help

pnpm run generate
pnpm run help

npm run generate
npm run help
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
