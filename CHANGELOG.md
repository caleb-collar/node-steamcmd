# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.1] - 2026-02-03

### Fixed

- **Critical Bug**: Fixed TypeScript/CommonJS interop issue with `tar` package that caused crashes on Linux/macOS during SteamCMD installation
  - Changed `import tar from 'tar'` to `import * as tar from 'tar'` in `src/download.ts`
  - This prevents the compiled code from incorrectly trying to access `tar.default.x()` which doesn't exist
  - The `tar` package exports its API directly without a default export
  - Resolves "Cannot read properties of undefined (reading 'x')" error during tar.gz extraction

## [1.1.0] - 2026-01-31

### Added

- **Full TypeScript source**: Entire codebase converted from JavaScript to TypeScript
- **Strict TypeScript configuration**: Enabled all strict mode checks for better type safety
- **TSDoc documentation**: All public APIs documented with TSDoc comments
- **API documentation generation**: `npm run docs` generates HTML documentation via TypeDoc

### Changed

- **Build system**: Package now compiles from TypeScript source to dist/ folder
- **Linting**: Replaced `standard` with Biome for modern, fast linting
- **Node.js imports**: Updated to use `node:` protocol for builtin modules

### Removed

- **standard linter**: Replaced with Biome (fixes eslint security vulnerability chain)
- **Legacy JavaScript source**: Source files are now TypeScript (.ts)

### Security

- **Resolved**: Removed `standard` linter dependency which had eslint vulnerability chain

## [1.0.0-alpha.2] - 2026-01-31

### Added

- **ESM module support**: Package now supports both CommonJS (`require`) and ES Modules (`import`)
- **`getInstalledApps()`**: List all installed Steam applications in a directory
- **`update()`**: Update an existing Steam application installation
- **`validate()`**: Validate an installed Steam application
- **`getInstalledVersion()`**: Get the installed version (build ID) of a Steam application
- **`createProgressEmitter()`**: Create an EventEmitter for real-time progress tracking
- **Renovate**: Replaced Dependabot with Renovate for better dependency management

### Changed

- **package.json**: Added `exports` field for dual CJS/ESM support
- **package.json**: Added `module` field pointing to ESM entry point
- **package.json**: Fixed bin path format (removed leading `./`)

### Removed

- **Travis CI**: Removed legacy `.travis.yml` (replaced by GitHub Actions)
- **Dependabot**: Removed `dependabot.yml` (replaced by Renovate)

### Security

- **Known Issue**: `standard` linter depends on eslint <9.26.0 which has a moderate severity vulnerability (GHSA-p5wg-g6qr-c7cg). This only affects development and does not impact published package. Will be resolved in v2.0 by migrating to Biome.

## [1.0.0-alpha.1] - 2026-01-31

### Added

- **Promise/async-await support**: All API functions now return Promises when no callback is provided
- **Progress tracking**: New `onProgress` callback for tracking download and installation progress
- **Output streaming**: New `onOutput` callback for real-time SteamCMD output
- **Utility functions**: `isInstalled()`, `ensureInstalled()`, and `getInfo()`
- **Custom error classes**: `SteamCmdError`, `DownloadError`, and `InstallError` with error codes
- **Input validation**: Comprehensive validation for all options with descriptive error messages
- **TypeScript definitions**: Full type definitions in `types/steamcmd.d.ts`
- **Test suite**: Comprehensive unit and integration tests with >80% coverage
- **CI/CD pipeline**: GitHub Actions for testing on Node 18/20/22 across Linux, Windows, and macOS
- **Automated publishing**: GitHub workflow for npm publishing on release
- **Dependabot**: Automated dependency updates

### Changed

- **BREAKING**: Minimum Node.js version is now 18 (previously no requirement)
- **BREAKING**: Download URLs now use HTTPS instead of HTTP
- **Dependencies**: Replaced `tarball-extract` with `tar` (actively maintained)
- **Dependencies**: Replaced `path-extra` with `env-paths` (modern alternative)
- **Dependencies**: Updated `commander` from v2 to v12 (CLI improvements)
- **Dependencies**: Updated `unzipper` to latest version
- **Dependencies**: Updated `standard` to v17 (dev dependency)
- **Data directory**: Now uses `env-paths` conventions
  - Linux: `~/.local/share/steamcmd` (was `~/.config/steamcmd`)
  - macOS: `~/Library/Application Support/steamcmd` (unchanged)
  - Windows: `%LOCALAPPDATA%\steamcmd` (unchanged)

### Fixed

- Security: Download URLs now use HTTPS instead of HTTP
- Error handling: All async operations now properly catch and report errors
- CLI: Updated to work with Commander v12 API

### Deprecated

- Callback-based API: Still supported but Promise API is recommended

## [0.3.1] - Previous Version

This was the last version before the modernization effort. See the git history for changes prior to this release.

---

## Migration Guide: 0.x to 1.0

### Minimum Node.js Version

Update to Node.js 18 or higher:

```bash
node --version  # Must be >= 18.0.0
```

### Using Promises (Recommended)

Before (callbacks):

```javascript
steamcmd.install({ applicationId: 740 }, function (err) {
  if (err) {
    console.error(err);
    return;
  }
  console.log("Done");
});
```

After (async/await):

```javascript
try {
  await steamcmd.install({ applicationId: 740 });
  console.log("Done");
} catch (err) {
  console.error(err);
}
```

### Data Directory Change (Linux)

If you have an existing SteamCMD installation on Linux, it may be in the old location:

```bash
# Old location
~/.config/steamcmd

# New location
~/.local/share/steamcmd
```

You can either:

1. Let the library download SteamCMD again to the new location
2. Move your existing installation: `mv ~/.config/steamcmd ~/.local/share/steamcmd`

### Error Handling

The library now throws typed errors:

```javascript
const { SteamCmdError, InstallError } = require("steamcmd");

try {
  await steamcmd.install(options);
} catch (err) {
  if (err instanceof InstallError) {
    console.error(`Install failed with code: ${err.code}`);
    console.error(`Exit code: ${err.exitCode}`);
  }
}
```

[Unreleased]: https://github.com/caleb-collar/node-steamcmd/compare/v1.0.0-alpha.2...HEAD
[1.0.0-alpha.2]: https://github.com/caleb-collar/node-steamcmd/compare/v1.0.0-alpha.1...v1.0.0-alpha.2
[1.0.0-alpha.1]: https://github.com/caleb-collar/node-steamcmd/compare/v0.3.1...v1.0.0-alpha.1
[0.3.1]: https://github.com/caleb-collar/node-steamcmd/releases/tag/v0.3.1
