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

| Package   | Current Version | Purpose                   | Status            |
| --------- | --------------- | ------------------------- | ----------------- |
| commander | ^12.1.0         | CLI argument parsing      | ✅ Current        |
| env-paths | ^2.2.1          | Platform data directories | ✅ Current        |
| tar       | ^7.4.3          | Extract .tar.gz archives  | ✅ Current        |
| unzipper  | ^0.12.3         | Extract .zip archives     | ✅ Current        |
| standard  | ^17.1.2         | Linting (dev)             | ⚠️ Has vuln chain |
| vitest    | ^4.0.18         | Testing framework (dev)   | ✅ Current        |

## Common Tasks

### Running the CLI

```bash
node bin/steamcmd [appid] [workshopid] --path ./install
```

### Testing Changes

```bash
npm run lint    # Run linter
npm test        # Run tests
npm run test:coverage  # Run tests with coverage report
```

### Publishing

```bash
npm version patch|minor|major
npm publish
```

## Pre-Commit Checklist

Before committing changes that affect functionality or prepare for release:

- [ ] **Version Bump** — Follow [Semantic Versioning](https://semver.org/):
  - `patch` (1.0.x): Bug fixes, documentation updates
  - `minor` (1.x.0): New features, backward-compatible changes
  - `major` (x.0.0): Breaking changes
- [ ] **Update CHANGELOG.md** — Document changes under `[Unreleased]` section
- [ ] **Run Tests** — Ensure `npm test` passes
- [ ] **Run Lint** — Ensure `npm run lint` passes
- [ ] **Check Coverage** — Aim for >80% coverage

## Release Workflow

After completing a phase in the BLUEPRINT and all tests pass:

1. **Bump version** using semantic versioning:

   ```bash
   npm version patch|minor|major  # or prerelease: npm version prerelease --preid=alpha
   ```

2. **Push tags** to origin:

   ```bash
   git push origin master --tags
   ```

3. **Create GitHub release** using gh CLI:

   ```bash
   # For stable releases
   gh release create v$(node -p "require('./package.json').version") \
     --title "v$(node -p "require('./package.json').version")" \
     --notes-file CHANGELOG.md

   # For prereleases (alpha, beta, rc)
   gh release create v$(node -p "require('./package.json').version") \
     --title "v$(node -p "require('./package.json').version")" \
     --notes-file CHANGELOG.md \
     --prerelease
   ```

4. **Monitor CI** for successful npm publish:
   ```bash
   gh run watch
   ```

> **Note:** The publish workflow automatically triggers on release creation and publishes to npm with the appropriate tag (alpha, beta, rc, or latest).

## Important Notes

1. **Test Coverage** — Current coverage is ~60%, target is 80%+
2. **Dual API** — Supports both Promise and callback patterns
3. **Dual Module** — Supports both ESM and CommonJS imports
4. **CI/CD Active** — GitHub Actions runs tests on push/PR, publishes on release
5. **TypeScript Ready** — Type definitions available in `types/steamcmd.d.ts`

## External Resources

- [SteamCMD Documentation](https://developer.valvesoftware.com/wiki/SteamCMD)
- [Steam App IDs](https://developer.valvesoftware.com/wiki/Steam_Application_IDs)
- [Original Author](https://github.com/dahlgren)

## Getting Help

If you need additional context:

1. Check `.agents-docs/` for detailed documentation
2. Review the BLUEPRINT.md for implementation priorities
3. Examine the source files directly for implementation details
