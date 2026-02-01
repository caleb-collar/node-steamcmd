# Architecture Overview

## System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Entry Point                        │
├─────────────────────────────────────────────────────────────────┤
│   CLI (bin/steamcmd)          │    Module (require('steamcmd')) │
│   └─ Uses Commander.js        │    └─ steamcmd.install()        │
└───────────────────────────────┴─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    src/steamcmd.js                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ steamCmdInstall(options, callback)                         │ │
│  │   1. Check if SteamCMD executable exists                   │ │
│  │   2. If not exists → download()                            │ │
│  │   3. Run install() with executable path                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    │                       │
                    ▼                       ▼
┌──────────────────────────────┐  ┌────────────────────────────────┐
│      src/download.js         │  │       src/install.js           │
│ ┌──────────────────────────┐ │  │ ┌────────────────────────────┐ │
│ │ download(callback)       │ │  │ │ install(path, opts, cb)    │ │
│ │ - Detect platform        │ │  │ │ - Build SteamCMD arguments │ │
│ │ - Download archive       │ │  │ │ - Spawn child process      │ │
│ │ - Extract to data dir    │ │  │ │ - Stream stdout/stderr     │ │
│ └──────────────────────────┘ │  │ │ - Return exit code         │ │
└──────────────────────────────┘  │ └────────────────────────────┘ │
            │                     └────────────────────────────────┘
            │                                   │
            ▼                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                        src/env.js                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ directory() → Platform-specific data directory             │ │
│  │ executable() → Full path to steamcmd binary                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### CLI Usage

```
steamcmd 107410 --username myuser --password mypass --path ./arma3
    │
    ▼
bin/steamcmd parses args with Commander
    │
    ▼
steamcmd.install({
  applicationId: "107410",
  username: "myuser",
  password: "mypass",
  path: "./arma3"
})
    │
    ▼
Check if steamcmd.exe/steamcmd.sh exists
    │
    ├─ NO → Download and extract SteamCMD
    │
    ▼
Spawn: steamcmd.exe +login myuser mypass +force_install_dir "./arma3" +app_update 107410 validate +quit
```

## Platform-Specific Behavior

| Platform | Data Directory                           | Executable     | Archive   |
| -------- | ---------------------------------------- | -------------- | --------- |
| Windows  | `%LOCALAPPDATA%\steamcmd`                | `steamcmd.exe` | `.zip`    |
| Linux    | `~/.config/steamcmd`                     | `steamcmd.sh`  | `.tar.gz` |
| macOS    | `~/Library/Application Support/steamcmd` | `steamcmd.sh`  | `.tar.gz` |

## SteamCMD Command Arguments

The `install.js` module builds command-line arguments:

```
+@sSteamCmdForcePlatformType <platform>    # Optional: Force platform
+@NoPromptForPassword 1                     # Never prompt for password
+@ShutdownOnFailedCommand 1                 # Exit on error
+set_steam_guard_code <code>                # Optional: Steam Guard
+login <username> <password>                # Or "anonymous"
+force_install_dir "<path>"                 # Installation directory
+app_update <appId> validate                # Install/update app
+workshop_download_item <appId> <itemId>    # Or download workshop item
+quit                                       # Exit when done
```

## Module Export

```javascript
// Current export
module.exports = {
  install: steamCmdInstall,
};

// Usage
const steamcmd = require("steamcmd");
steamcmd.install(
  {
    applicationId: "107410",
    path: "./game",
  },
  (err) => {
    if (err) console.error(err);
  },
);
```
