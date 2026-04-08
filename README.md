# ScaffScript

![ScaffScript Banner](./assets/Banner/banner1-4-1.webp)

A minimal superset language of **GameMaker Language** (GML) for creating module-based GameMaker source codes. This minimal language is mainly used for developing GML libraries, but can also be used for other purposes.

> [!CAUTION]
> ScaffScript is **not** affiliated with or endorsed by YoYo Games Ltd. GameMaker and GML are trademarks of YoYo Games Ltd. 

> [!WARNING]
> This project is still in early development. The syntax and features are subject to change. Use at your own risk.

---

## Key Features

- **TypeScript-like Module System**. Use `export`, `import`, and `include` to organize code across `.scaff` files, fully resolved at compile-time.
- **Class Syntax**. Define classes with constructors, properties, and methods that compile to GML struct constructors. Extend classes across files with `impl`.
- **Content Directives**. Inline compiled GML content (`@content`, `@valueof`, `@:`, etc.) directives for dynamic code insertion.
- **Special Values**. Access compile-time tokens like `@now`, `@today`, `@version`, `@file`, and `@line` for metadata and debugging.
- **Code Generation Blocks**. Use `#[blockName]` to define named content sections and `intg` to map them to GameMaker asset paths.
- **GameMaker Integration**. Automatically writes `.gml` files, generates `.yy` metadata, and updates your `.yyp` project file for scripts and objects.
- **File Scanning & Processing**. Recursive scanning of `.scaff` and `.gml` files with dependency-aware processing order.

---

## Installation & Documentation

For more information, please refer to the official [documentation](https://scaffscript.lefinitas.com).

---

## Questions & Feature Requests

Feel free to start a [discussion](https://github.com/undervolta/scaffscript/discussions) or open an [issue](https://github.com/undervolta/scaffscript/issues) for any questions or feature requests.

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the [repository](https://github.com/undervolta/scaffscript).
2. Clone the forked repository to your local machine.
3. Make and test your changes.
4. Commit your changes and push it to your forked repository.
5. Open a pull request to the main repository.

---

## Support

If you like this project, or this project helped you in any way, please consider supporting me on [Ko-fi](https://ko-fi.com/undervolta) or [Trakteer](https://trakteer.id/undervolta). Don't forget to leave a star! Your support is greatly appreciated!

---

## License

ScaffScript is **free** and **open-source**. It's licensed under the [MIT License](./LICENSE).
