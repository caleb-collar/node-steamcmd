# SteamCMD

[![CI](https://github.com/dahlgren/node-steamcmd/actions/workflows/ci.yml/badge.svg)](https://github.com/dahlgren/node-steamcmd/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/steamcmd.svg)](https://www.npmjs.com/package/steamcmd)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Node.js wrapper for Valve's [SteamCMD](https://developer.valvesoftware.com/wiki/SteamCMD) tool. Download, install, and manage Steam applications programmatically.

**Features:**

- Automatic SteamCMD download and installation
- Promise-based API with async/await support
- Progress tracking for downloads and installations
- TypeScript definitions included
- Cross-platform (Windows, Linux, macOS)

SteamCMD will be automatically downloaded to your platform-specific data folder:

- **Linux:** `~/.local/share/steamcmd`
- **macOS:** `~/Library/Application Support/steamcmd`
- **Windows:** `%LOCALAPPDATA%\steamcmd`

## Requirements

**Node.js 18 or higher** is required.

See [SteamCMD requirements](https://developer.valvesoftware.com/wiki/SteamCMD) for platform-specific dependencies.

For Ubuntu/Debian:

```bash
sudo apt-get install lib32gcc-s1
```

## Installation

```bash
npm install steamcmd
```

## Usage

### Module API (Recommended)

#### Basic Installation

```javascript
const steamcmd = require("steamcmd");

// Install a dedicated server (e.g., Counter-Strike 2)
await steamcmd.install({
  applicationId: 730,
  path: "./cs2-server",
});
```

#### With Authentication

```javascript
await steamcmd.install({
  applicationId: 123456,
  path: "./game-server",
  username: "your-steam-username",
  password: "your-steam-password",
  steamGuardCode: "12345", // If Steam Guard is enabled
});
```

#### Workshop Items

```javascript
// Download a workshop item
await steamcmd.install({
  applicationId: 107410, // Arma 3
  workshopId: 450814997,
  path: "./arma3",
});
```

#### Progress Tracking

```javascript
await steamcmd.install({
  applicationId: 740,
  path: "./csds",
  onProgress: (progress) => {
    console.log(`${progress.phase}: ${progress.percent}%`);
    // Output: "downloading: 45%", "validating: 100%"
  },
  onOutput: (data, type) => {
    // type is 'stdout' or 'stderr'
    process.stdout.write(data);
  },
});
```

#### Utility Functions

```javascript
const steamcmd = require("steamcmd");

// Check if SteamCMD is installed
const installed = await steamcmd.isInstalled();
console.log("SteamCMD installed:", installed);

// Get installation info
const info = steamcmd.getInfo();
console.log(info);
// {
//   directory: '/home/user/.local/share/steamcmd',
//   executable: '/home/user/.local/share/steamcmd/steamcmd.sh',
//   platform: 'linux',
//   isSupported: true
// }

// Manually ensure SteamCMD is installed
await steamcmd.ensureInstalled({
  onProgress: (p) => console.log(`Download: ${p.percent}%`),
});
```

#### Error Handling

```javascript
const { SteamCmdError, DownloadError, InstallError } = require("steamcmd");

try {
  await steamcmd.install({
    applicationId: 740,
    path: "./server",
  });
} catch (err) {
  if (err instanceof SteamCmdError) {
    console.error(`SteamCMD error: ${err.message} (code: ${err.code})`);
  } else if (err instanceof InstallError) {
    console.error(`Install failed: ${err.message}`);
    console.error(`Exit code: ${err.exitCode}`);
  } else {
    throw err;
  }
}
```

#### Legacy Callback API

```javascript
// Callback-style is still supported for backward compatibility
steamcmd.install({ applicationId: 740, path: "./server" }, (err) => {
  if (err) {
    console.error("Installation failed:", err.message);
    return;
  }
  console.log("Installation complete!");
});
```

### API Reference

#### `install(options, [callback])`

Install a Steam application or Workshop item.

| Option           | Type               | Description                                           |
| ---------------- | ------------------ | ----------------------------------------------------- |
| `applicationId`  | `number \| string` | Steam application ID to install                       |
| `workshopId`     | `number \| string` | Workshop item ID (requires `applicationId`)           |
| `path`           | `string`           | Installation directory                                |
| `username`       | `string`           | Steam username for authentication                     |
| `password`       | `string`           | Steam password for authentication                     |
| `steamGuardCode` | `string`           | Steam Guard code for 2FA                              |
| `platform`       | `string`           | Target platform: `'windows'`, `'macos'`, or `'linux'` |
| `onProgress`     | `function`         | Progress callback: `(progress) => void`               |
| `onOutput`       | `function`         | Output callback: `(data, type) => void`               |

**Returns:** `Promise<void>` if no callback provided, `undefined` if callback provided.

#### `isInstalled()`

Check if SteamCMD is installed and executable.

**Returns:** `Promise<boolean>`

#### `ensureInstalled([options])`

Ensure SteamCMD is installed, downloading if necessary.

| Option       | Type       | Description                |
| ------------ | ---------- | -------------------------- |
| `onProgress` | `function` | Download progress callback |

**Returns:** `Promise<void>`

#### `getInfo()`

Get information about the SteamCMD installation.

**Returns:** `{ directory, executable, platform, isSupported }`

### Command Line Interface

```bash
npx steamcmd <appid> [workshopid] [options]
```

**Options:**

| Option                     | Description                               |
| -------------------------- | ----------------------------------------- |
| `-u, --username <value>`   | Steam username                            |
| `-p, --password <value>`   | Steam password                            |
| `--path <value>`           | Install path (default: current directory) |
| `--platform <value>`       | Target platform                           |
| `--steamGuardCode <value>` | Steam Guard code                          |
| `-h, --help`               | Show help                                 |

**Examples:**

```bash
# Install CS2 dedicated server
npx steamcmd 730 --path ./cs2-server

# Install with authentication
npx steamcmd 123456 --username myuser --password mypass --path ./game

# Install a workshop item
npx steamcmd 107410 450814997 --path ./arma3
```

## TypeScript

TypeScript definitions are included:

```typescript
import steamcmd, { SteamCmdError, InstallOptions } from "steamcmd";

const options: InstallOptions = {
  applicationId: 740,
  path: "./server",
  onProgress: (progress) => {
    console.log(`${progress.phase}: ${progress.percent}%`);
  },
};

await steamcmd.install(options);
```

## Finding App IDs

- [Steam Application IDs](https://developer.valvesoftware.com/wiki/Steam_Application_IDs)
- [SteamDB](https://steamdb.info/)

Workshop IDs can be found in the URL of any Workshop item page.

## License

MIT © [Björn Dahlgren](https://github.com/dahlgren)
