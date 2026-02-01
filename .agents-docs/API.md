# API Reference

## Module API

### steamcmd.install(options, callback)

Downloads SteamCMD if needed and installs a Steam application or Workshop item.

#### Parameters

| Option           | Type     | Required | Description                                 |
| ---------------- | -------- | -------- | ------------------------------------------- |
| `applicationId`  | `string` | Yes      | Steam Application ID to install             |
| `path`           | `string` | No       | Installation directory (defaults to CWD)    |
| `username`       | `string` | No       | Steam account username                      |
| `password`       | `string` | No       | Steam account password                      |
| `platform`       | `string` | No       | Force platform: `windows`, `linux`, `macos` |
| `steamGuardCode` | `string` | No       | Steam Guard 2FA code                        |
| `workshopId`     | `string` | No       | Workshop item ID (requires applicationId)   |

#### Callback

```javascript
function callback(error) {
  // error: Error object or null
}
```

#### Examples

**Anonymous Login (Free Games)**

```javascript
const steamcmd = require("steamcmd");

steamcmd.install(
  {
    applicationId: "740", // Counter-Strike Global Offensive Dedicated Server
    path: "./csgo-server",
  },
  (err) => {
    if (err) {
      console.error("Installation failed:", err);
    } else {
      console.log("Installation complete!");
    }
  },
);
```

**Authenticated Login**

```javascript
steamcmd.install(
  {
    applicationId: "107410", // Arma 3
    path: "./arma3",
    username: "myuser",
    password: "mypassword",
    steamGuardCode: "12345",
  },
  callback,
);
```

**Workshop Item**

```javascript
steamcmd.install(
  {
    applicationId: "107410",
    workshopId: "450814997", // CBA_A3 mod
    path: "./arma3",
    username: "myuser",
    password: "mypassword",
  },
  callback,
);
```

**Cross-Platform Download**

```javascript
steamcmd.install(
  {
    applicationId: "740",
    path: "./csgo-linux",
    platform: "linux",
  },
  callback,
);
```

---

## CLI API

```
steamcmd [options] <appid> [workshopid]
```

### Arguments

| Argument     | Description                     |
| ------------ | ------------------------------- |
| `appid`      | Steam Application ID (required) |
| `workshopid` | Workshop Item ID (optional)     |

### Options

| Flag                       | Description                              |
| -------------------------- | ---------------------------------------- |
| `-u, --username <value>`   | Steam account username                   |
| `-p, --password <value>`   | Steam account password                   |
| `--path <value>`           | Installation directory (defaults to CWD) |
| `--platform <value>`       | Force platform type                      |
| `--steamGuardCode <value>` | Steam Guard 2FA code                     |
| `-h, --help`               | Show help                                |

### Examples

```bash
# Install CS:GO dedicated server anonymously
steamcmd 740 --path ./csgo-server

# Install with authentication
steamcmd 107410 --username myuser --password mypass --path ./arma3

# Download workshop item
steamcmd 107410 450814997 --username myuser --password mypass

# Force Linux platform on Windows
steamcmd 740 --platform linux --path ./csgo-linux
```

---

## Internal Functions

### env.directory()

Returns platform-specific data directory path.

```javascript
const env = require("./env");
env.directory();
// Windows: C:\Users\<user>\AppData\Local\steamcmd
// Linux: /home/<user>/.config/steamcmd
// macOS: /Users/<user>/Library/Application Support/steamcmd
```

### env.executable()

Returns full path to SteamCMD executable.

```javascript
env.executable();
// Windows: C:\Users\<user>\AppData\Local\steamcmd\steamcmd.exe
// Linux: /home/<user>/.config/steamcmd/steamcmd.sh
```

### download(callback)

Downloads and extracts SteamCMD for current platform.

```javascript
const download = require("./download");
download((err) => {
  if (err) console.error("Download failed");
});
```

### install(executablePath, options, callback)

Spawns SteamCMD process with constructed arguments.

```javascript
const install = require("./install");
install(
  "/path/to/steamcmd.sh",
  {
    applicationId: "740",
    path: "./server",
  },
  callback,
);
```
