# Contributing to ScaffScript

Thank you for your interest in contributing to ScaffScript! We welcome contributions from the community. This document provides guidelines and information to help you get started.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Reporting Issues](#reporting-issues)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Bun** (recommended) or **Node.js** (v18 or later)
- **TypeScript** (v5 or later)
- **Git**

> [!NOTE]
> Bun is recommended for faster builds and development experience.

## Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/scaffscript.git
   cd scaffscript
   ```
3. **Install dependencies**:
   ```bash
   bun install
   # or
   npm install
   ```
4. **Verify setup** by running the development command:
   ```bash
   bun run dev
   ```

## Development Workflow

### Building the Project

- **Build for production**:
  ```bash
  bun run build
  ```
  This builds both Node.js and Bun versions.

- **Build specific targets**:
  ```bash
  bun run build:node    # Build for Node.js
  bun run build:bun     # Build for Bun
  ```

### Development Mode

- **Run in development mode**:
  ```bash
  bun run dev
  ```
  This runs the CLI in development mode for testing changes.

### Testing

- **Run tests**:
  ```bash
  bun test
  # or
  npm test
  ```

## Coding Standards

ScaffScript follows strict TypeScript coding standards:

- **TypeScript strict mode** is enabled with additional strict flags
- Use **ESNext** features where appropriate
- Follow **consistent naming conventions** (camelCase for variables/functions, PascalCase for classes/types)
- **Document complex logic** with comments
- **Keep functions small and focused** on single responsibilities

### Code Style

- Use **tabs (size = 4)** for indentation
- **Semicolons are required**
- **Single quotes** for strings, **double quotes** for JSX-like content
- **Trailing commas** in multi-line structures

### Commit Messages

Use clear, descriptive commit messages following conventional commits:

```
feat(parser): add new export resolution feature
fix(generator): resolve issue with class inheritance
docs: update module system documentation
```

## Testing

- Write tests for new features in the `tests/` directory
- Ensure all existing tests pass before submitting changes
- Test both positive and negative scenarios
- Include integration tests for complex features

## Submitting Changes

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards

3. **Test your changes** thoroughly

4. **Commit your changes** with clear messages

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub:
   - Provide a clear description of the changes
   - Reference any related issues
   - Ensure CI checks pass

## Project Structure

```
scaffscript/
├── src/                    # Source code
│   ├── cli/               # CLI commands
│   ├── fs/                # File system utilities
│   ├── generator/         # Code generation logic
│   ├── parser/            # Language parsing
│   ├── integration/       # GameMaker integration
│   ├── runtime/           # Runtime utilities
│   └── utils/             # General utilities
├── tests/                 # Test files
├── docs/                  # Documentation
├── specs/                 # Specifications
├── types/                 # Type definitions
├── build/                 # Build output (Bun)
└── dist/                  # Distribution output (Node.js)
```

## Documentation

- **User Documentation**: Located in `docs/` directory
- **Specifications**: Located in `specs/` directory
- **API Documentation**: Generated from code comments

When adding new features, update the relevant documentation files.

## Reporting Issues

- **Bug Reports**: Use the [issue tracker](https://github.com/undervolta/scaffscript/issues)
- **Feature Requests**: Start a [discussion](https://github.com/undervolta/scaffscript/discussions)
- **Questions**: Check existing issues/discussions or create new ones

### Issue Guidelines

- **Search existing issues** first
- **Use issue templates** when available
- **Provide clear reproduction steps** for bugs
- **Include environment details** (OS, Node/Bun version, etc.)

## Development Notes

> [!WARNING]
> ScaffScript is in early development. Syntax and features are subject to change. Use at your own risk.

- **Breaking Changes**: May be introduced in minor versions during early development
- **Experimental Features**: Marked with appropriate warnings in documentation
- **Backwards Compatibility**: Not guaranteed until v1.0.0

## Getting Help

- **Documentation**: [scaffscript.lefinitas.com](https://scaffscript.lefinitas.com)
- **Discussions**: [GitHub Discussions](https://github.com/undervolta/scaffscript/discussions)
- **Issues**: [GitHub Issues](https://github.com/undervolta/scaffscript/issues)

Thank you for contributing to ScaffScript! 
