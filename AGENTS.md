# AGENTS.md

> **START HERE** — This file provides essential guidance for AI agents working on this repository.

## Quick Start

1. Read [BLUEPRINT.md](BLUEPRINT.md) for the implementation roadmap
2. Review [.agents-docs/](.agents-docs/) for detailed technical documentation
3. Follow the conventions below when making changes

## Repository Overview

**node-steamcmd** is a Node.js wrapper library for Valve's SteamCMD tool. It provides both a CLI and programmatic API to:

- Automatically download and install SteamCMD
- Install Steam applications and Workshop items
- Support cross-platform (Windows, Linux, macOS)

## Project Structure

```
node-steamcmd/
├── bin/steamcmd          # CLI entry point
├── src/
│   ├── steamcmd.js       # Main module export
│   ├── download.js       # SteamCMD binary download logic
│   ├── install.js        # Steam app/workshop installation
│   └── env.js            # Platform-specific paths
├── package.json          # Package manifest
└── README.md             # User documentation
```

## Key Files to Understand

| File              | Purpose                                         |
| ----------------- | ----------------------------------------------- |
| `src/steamcmd.js` | Main entry point - exports `install()` function |
| `src/download.js` | Downloads SteamCMD for current platform         |
| `src/install.js`  | Spawns SteamCMD with appropriate arguments      |
| `src/env.js`      | Platform detection and path resolution          |
| `bin/steamcmd`    | CLI wrapper using Commander.js                  |

## Coding Conventions

### Current State (Legacy)

- CommonJS modules (`require`/`module.exports`)
- Callback-based async patterns
- Node.js ES5 style code
- No TypeScript

### Target State (Modernization)

- ES Modules with CommonJS fallback
- Promise/async-await patterns
- Modern Node.js (18+) features
- TypeScript definitions (.d.ts)
- Comprehensive test coverage

## Dependencies

| Package         | Current Version | Purpose                   | Status                |
| --------------- | --------------- | ------------------------- | --------------------- |
| commander       | ^2.2.0          | CLI argument parsing      | ⚠️ Very outdated      |
| path-extra      | ^0.3.0          | Platform data directories | ⚠️ Consider replacing |
| tarball-extract | 0.0.6           | Extract .tar.gz archives  | ⚠️ Very outdated      |
| unzipper        | ^0.10.5         | Extract .zip archives     | ✅ Okay               |
| standard        | ^10.0.2         | Linting (dev)             | ⚠️ Outdated           |

## Common Tasks

### Running the CLI

```bash
node bin/steamcmd [appid] [workshopid] --path ./install
```

### Testing Changes

```bash
npm run lint    # Run linter
npm test        # Run tests (currently not implemented)
```

### Publishing

```bash
npm version patch|minor|major
npm publish
```

## Important Notes

1. **No Tests Exist** — Tests need to be created from scratch
2. **Callback Hell** — Async code uses nested callbacks, not Promises
3. **HTTP URLs** — Download URLs use HTTP, not HTTPS (security concern)
4. **No Error Handling** — Many edge cases are not handled
5. **No CI/CD** — No automated testing or publishing pipeline

## External Resources

- [SteamCMD Documentation](https://developer.valvesoftware.com/wiki/SteamCMD)
- [Steam App IDs](https://developer.valvesoftware.com/wiki/Steam_Application_IDs)
- [Original Author](https://github.com/dahlgren)

## Getting Help

If you need additional context:

1. Check `.agents-docs/` for detailed documentation
2. Review the BLUEPRINT.md for implementation priorities
3. Examine the source files directly for implementation details
