# Modernization Guide

This document outlines the technical changes needed to modernize the codebase.

## Priority 1: Critical Updates

### 1.1 Update Dependencies

**Current Issues:**

- `commander@^2.2.0` → Current is v12+ (breaking changes)
- `tarball-extract@0.0.6` → Unmaintained, security issues
- `path-extra@^0.3.0` → Consider using `env-paths` or `app-data-folder`
- `standard@^10.0.2` → Current is v17+

**Recommended Replacements:**

| Current           | Replacement                    | Reason                      |
| ----------------- | ------------------------------ | --------------------------- |
| `tarball-extract` | `tar` (npm)                    | Maintained, widely used     |
| `path-extra`      | `env-paths`                    | Modern, actively maintained |
| `http` downloads  | `https` module or `node-fetch` | Security                    |

### 1.2 Security Fixes

```javascript
// BEFORE: HTTP downloads (insecure)
var urls = {
  darwin: "http://media.steampowered.com/client/installer/steamcmd_osx.tar.gz",
  linux: "http://media.steampowered.com/installer/steamcmd_linux.tar.gz",
  win32: "http://media.steampowered.com/installer/steamcmd.zip",
};

// AFTER: HTTPS downloads
const urls = {
  darwin:
    "https://steamcdn-a.akamaihd.net/client/installer/steamcmd_osx.tar.gz",
  linux:
    "https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz",
  win32: "https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip",
};
```

---

## Priority 2: API Modernization

### 2.1 Promise-Based API

**Current callback style:**

```javascript
steamcmd.install(options, (err) => {
  if (err) console.error(err);
});
```

**Target async/await style:**

```javascript
// Promises
steamcmd
  .install(options)
  .then(() => console.log("Done"))
  .catch((err) => console.error(err));

// Async/await
try {
  await steamcmd.install(options);
  console.log("Done");
} catch (err) {
  console.error(err);
}
```

### 2.2 Implementation Pattern

```javascript
// Support both callbacks and promises
function install(options, callback) {
  const promise = new Promise((resolve, reject) => {
    // ... implementation
  });

  if (callback) {
    promise.then(() => callback(null)).catch(callback);
  }

  return promise;
}
```

---

## Priority 3: Module System

### 3.1 Dual CJS/ESM Support

**package.json additions:**

```json
{
  "type": "module",
  "exports": {
    ".": {
      "import": "./src/steamcmd.mjs",
      "require": "./src/steamcmd.cjs"
    }
  },
  "main": "./src/steamcmd.cjs",
  "module": "./src/steamcmd.mjs"
}
```

### 3.2 Modern Code Style

```javascript
// BEFORE
var fs = require('fs')
var download = require('./download')

function steamCmdInstall (options, callback) {
  fs.access(env.executable(), ...)
}

module.exports = { install: steamCmdInstall }

// AFTER
import fs from 'node:fs/promises';
import { download } from './download.js';

export async function install(options) {
  await fs.access(env.executable(), fs.constants.X_OK);
  // ...
}
```

---

## Priority 4: Testing

### 4.1 Test Framework Setup

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "c8": "^8.0.0"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 4.2 Test Structure

```
tests/
├── unit/
│   ├── env.test.js
│   ├── download.test.js
│   └── install.test.js
├── integration/
│   └── steamcmd.test.js
└── fixtures/
    └── mock-steamcmd/
```

### 4.3 Mock Strategy

SteamCMD is an external dependency that can't be easily mocked. Strategy:

1. Unit test argument building (`createArguments`)
2. Mock `child_process.execFile` for install tests
3. Mock HTTP responses for download tests
4. Integration tests with real SteamCMD (CI only, slow)

---

## Priority 5: TypeScript Definitions

### 5.1 Type Definitions File

Create `types/steamcmd.d.ts`:

```typescript
declare module "steamcmd" {
  export interface InstallOptions {
    applicationId: string;
    path?: string;
    username?: string;
    password?: string;
    platform?: "windows" | "linux" | "macos";
    steamGuardCode?: string;
    workshopId?: string;
  }

  export function install(options: InstallOptions): Promise<void>;
  export function install(
    options: InstallOptions,
    callback: (error: Error | null) => void,
  ): void;
}
```

### 5.2 Package.json Types

```json
{
  "types": "./types/steamcmd.d.ts"
}
```

---

## Priority 6: CI/CD

### 6.1 GitHub Actions Workflow

`.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci
      - run: npm test
```

### 6.2 NPM Publishing Workflow

`.github/workflows/publish.yml`:

```yaml
name: Publish
on:
  release:
    types: [published]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: "https://registry.npmjs.org"
      - run: npm ci
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Migration Checklist

- [ ] Update Node.js engine requirement to >=18
- [ ] Replace deprecated dependencies
- [ ] Convert to HTTPS URLs
- [ ] Add Promise support (maintain callback compatibility)
- [ ] Add TypeScript definitions
- [ ] Set up test framework
- [ ] Write unit tests for core functions
- [ ] Add GitHub Actions CI
- [ ] Add GitHub Actions publish workflow
- [ ] Update README with modern examples
- [ ] Create CHANGELOG.md
- [ ] Bump version to 1.0.0
