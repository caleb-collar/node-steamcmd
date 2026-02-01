/**
 * @module steamcmd
 * @description Node.js wrapper for SteamCMD - download, install, and manage Steam applications
 * @author Björn Dahlgren
 * @license MIT
 * @see https://github.com/dahlgren/node-steamcmd
 */

const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const { EventEmitter } = require("events");

const download = require("./download");
const env = require("./env");
const install = require("./install");

const access = promisify(fs.access);
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

/**
 * Custom error class for SteamCMD operations
 */
class SteamCmdError extends Error {
  constructor(message, code, cause) {
    super(message);
    this.name = "SteamCmdError";
    this.code = code;
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Check if SteamCMD is installed and executable
 * @returns {Promise<boolean>} True if SteamCMD is available
 */
async function isInstalled() {
  const executablePath = env.executable();
  if (!executablePath) return false;

  try {
    await access(executablePath, (fs.constants || fs).X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure SteamCMD is installed, downloading if necessary
 * @param {Object} [options] - Options
 * @param {Function} [options.onProgress] - Download progress callback
 * @returns {Promise<void>}
 * @throws {SteamCmdError} If download fails
 */
async function ensureInstalled(options) {
  options = options || {};
  const installed = await isInstalled();
  if (installed) return;

  console.log("SteamCMD needs to be installed");

  try {
    await download({ onProgress: options.onProgress });
    console.log("SteamCMD was installed");
  } catch (err) {
    throw new SteamCmdError(
      "Failed to install SteamCMD",
      "INSTALL_FAILED",
      err,
    );
  }
}

/**
 * Install a Steam application or Workshop item
 *
 * @param {Object} options - Installation options
 * @param {number|string} [options.applicationId] - Steam application ID to install
 * @param {number|string} [options.workshopId] - Workshop item ID to install (requires applicationId)
 * @param {string} [options.path] - Installation directory
 * @param {string} [options.username] - Steam username for authentication
 * @param {string} [options.password] - Steam password for authentication
 * @param {string} [options.steamGuardCode] - Steam Guard code for two-factor authentication
 * @param {string} [options.platform] - Target platform ('windows', 'macos', 'linux')
 * @param {Function} [options.onProgress] - Progress callback(progress) with { phase, percent, bytesDownloaded, totalBytes }
 * @param {Function} [options.onOutput] - Output callback(data, type) where type is 'stdout' or 'stderr'
 * @param {Function} [callback] - Optional callback(err). If omitted, returns a Promise.
 * @returns {Promise<void>|undefined} Promise if no callback provided
 *
 * @example
 * // Promise-based usage with progress
 * await steamcmd.install({
 *   applicationId: 740,
 *   path: './server',
 *   onProgress: (p) => console.log(`${p.phase}: ${p.percent}%`)
 * });
 *
 * @example
 * // Callback-based usage (legacy)
 * steamcmd.install({ applicationId: 740 }, (err) => {
 *   if (err) console.error(err);
 * });
 */
function steamCmdInstall(options, callback) {
  // Support Promise-based usage
  if (typeof callback !== "function") {
    return steamCmdInstallAsync(options);
  }

  // Legacy callback-based usage
  steamCmdInstallAsync(options)
    .then(() => callback(null))
    .catch((err) => callback(err));
}

/**
 * Async implementation of install
 * @private
 */
async function steamCmdInstallAsync(options) {
  // Validate options early
  if (!options || typeof options !== "object") {
    throw new SteamCmdError("Options must be an object", "INVALID_OPTIONS");
  }

  // Ensure SteamCMD is installed (pass download progress)
  await ensureInstalled({ onProgress: options.onProgress });

  // Run installation
  const executablePath = env.executable();
  try {
    await install(executablePath, options);
  } catch (err) {
    throw new SteamCmdError(
      `Installation failed: ${err.message}`,
      "RUN_FAILED",
      err,
    );
  }
}

/**
 * Get information about the SteamCMD installation
 * @returns {Object} SteamCMD paths and status
 */
function getInfo() {
  return {
    directory: env.directory(),
    executable: env.executable(),
    platform: env.platform(),
    isSupported: env.isPlatformSupported(),
  };
}

/**
 * Parse Steam app manifest file (.acf)
 * @param {string} manifestPath - Path to the manifest file
 * @returns {Promise<Object>} Parsed manifest data
 * @private
 */
async function parseAppManifest(manifestPath) {
  const content = await readFile(manifestPath, "utf8");
  const result = {};

  // Simple VDF parser for app manifests
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/"(\w+)"\s+"([^"]*)"/);
    if (match) {
      result[match[1]] = match[2];
    }
  }

  return result;
}

/**
 * Get a list of installed Steam applications in a directory
 * @param {Object} options - Options
 * @param {string} options.path - Installation directory to scan
 * @returns {Promise<Array<Object>>} Array of installed app information
 *
 * @example
 * const apps = await steamcmd.getInstalledApps({ path: './server' });
 * // [{ appId: 740, name: 'Counter-Strike Global Offensive - Dedicated Server', ... }]
 */
async function getInstalledApps(options) {
  if (!options || !options.path) {
    throw new SteamCmdError("path option is required", "INVALID_OPTIONS");
  }

  const steamappsDir = path.join(options.path, "steamapps");
  const apps = [];

  try {
    await access(steamappsDir, fs.constants.R_OK);
  } catch {
    // No steamapps directory, return empty array
    return apps;
  }

  try {
    const files = await readdir(steamappsDir);
    const manifestFiles = files.filter(
      (f) => f.startsWith("appmanifest_") && f.endsWith(".acf"),
    );

    for (const file of manifestFiles) {
      try {
        const manifest = await parseAppManifest(path.join(steamappsDir, file));
        apps.push({
          appId: parseInt(manifest.appid, 10),
          name: manifest.name || "Unknown",
          installDir: manifest.installdir || null,
          sizeOnDisk: parseInt(manifest.SizeOnDisk || "0", 10),
          buildId: parseInt(manifest.buildid || "0", 10),
          lastUpdated: manifest.LastUpdated
            ? new Date(parseInt(manifest.LastUpdated, 10) * 1000)
            : null,
          state: parseInt(manifest.StateFlags || "0", 10),
        });
      } catch {
        // Skip invalid manifest files
      }
    }
  } catch {
    // Error reading directory
  }

  return apps;
}

/**
 * Update an installed Steam application
 * @param {Object} options - Update options
 * @param {number|string} options.applicationId - Steam application ID to update
 * @param {string} [options.path] - Installation directory
 * @param {string} [options.username] - Steam username for authentication
 * @param {string} [options.password] - Steam password for authentication
 * @param {string} [options.steamGuardCode] - Steam Guard code
 * @param {string} [options.platform] - Target platform
 * @param {Function} [options.onProgress] - Progress callback
 * @param {Function} [options.onOutput] - Output callback
 * @returns {Promise<void>}
 *
 * @example
 * await steamcmd.update({
 *   applicationId: 740,
 *   path: './server',
 *   onProgress: (p) => console.log(`${p.phase}: ${p.percent}%`)
 * });
 */
async function update(options) {
  if (!options || !options.applicationId) {
    throw new SteamCmdError(
      "applicationId option is required",
      "INVALID_OPTIONS",
    );
  }

  // update is essentially the same as install - SteamCMD handles both
  return steamCmdInstallAsync(options);
}

/**
 * Validate an installed Steam application
 * @param {Object} options - Validation options
 * @param {number|string} options.applicationId - Steam application ID to validate
 * @param {string} [options.path] - Installation directory
 * @param {string} [options.username] - Steam username for authentication
 * @param {string} [options.password] - Steam password for authentication
 * @param {string} [options.steamGuardCode] - Steam Guard code
 * @param {Function} [options.onProgress] - Progress callback
 * @param {Function} [options.onOutput] - Output callback
 * @returns {Promise<void>}
 *
 * @example
 * await steamcmd.validate({
 *   applicationId: 740,
 *   path: './server'
 * });
 */
async function validate(options) {
  if (!options || !options.applicationId) {
    throw new SteamCmdError(
      "applicationId option is required",
      "INVALID_OPTIONS",
    );
  }

  // validate is the same as install - SteamCMD always validates
  return steamCmdInstallAsync(options);
}

/**
 * Get the installed version (build ID) of a Steam application
 * @param {Object} options - Options
 * @param {number|string} options.applicationId - Steam application ID
 * @param {string} options.path - Installation directory
 * @returns {Promise<Object|null>} Version information or null if not installed
 *
 * @example
 * const version = await steamcmd.getInstalledVersion({
 *   applicationId: 740,
 *   path: './server'
 * });
 * // { appId: 740, buildId: 12345678, lastUpdated: Date }
 */
async function getInstalledVersion(options) {
  if (!options || !options.applicationId || !options.path) {
    throw new SteamCmdError(
      "applicationId and path options are required",
      "INVALID_OPTIONS",
    );
  }

  const appId = Number(options.applicationId);
  const manifestPath = path.join(
    options.path,
    "steamapps",
    `appmanifest_${appId}.acf`,
  );

  try {
    await access(manifestPath, fs.constants.R_OK);
    const manifest = await parseAppManifest(manifestPath);

    return {
      appId: parseInt(manifest.appid, 10),
      name: manifest.name || "Unknown",
      buildId: parseInt(manifest.buildid || "0", 10),
      lastUpdated: manifest.LastUpdated
        ? new Date(parseInt(manifest.LastUpdated, 10) * 1000)
        : null,
    };
  } catch {
    return null;
  }
}

/**
 * Create an EventEmitter for SteamCMD operations with real-time progress
 * @param {string} operation - Operation type ('install', 'update', 'validate')
 * @param {Object} options - Operation options
 * @returns {EventEmitter} Emitter that fires 'progress', 'output', 'error', and 'complete' events
 *
 * @example
 * const emitter = steamcmd.createProgressEmitter('install', { applicationId: 740 });
 * emitter.on('progress', (p) => console.log(`${p.phase}: ${p.percent}%`));
 * emitter.on('output', (data, type) => console.log(`[${type}] ${data}`));
 * emitter.on('complete', () => console.log('Done!'));
 * emitter.on('error', (err) => console.error(err));
 */
function createProgressEmitter(operation, options) {
  const emitter = new EventEmitter();

  process.nextTick(async () => {
    try {
      // Ensure SteamCMD is installed first
      await ensureInstalled({
        onProgress: (progress) => emitter.emit("progress", progress),
      });

      // Run the operation
      const executablePath = env.executable();
      const operationOptions = {
        ...options,
        onProgress: (progress) => emitter.emit("progress", progress),
        onOutput: (data, type) => emitter.emit("output", data, type),
      };

      await install(executablePath, operationOptions);
      emitter.emit("complete");
    } catch (err) {
      emitter.emit("error", err);
    }
  });

  return emitter;
}

module.exports = {
  install: steamCmdInstall,
  isInstalled,
  ensureInstalled,
  getInfo,
  SteamCmdError,
  // New functions
  getInstalledApps,
  update,
  validate,
  getInstalledVersion,
  createProgressEmitter,
  // Re-export error classes for consumers
  DownloadError: download.DownloadError,
  InstallError: install.InstallError,
  // Re-export progress helpers
  downloadWithProgress: download.downloadWithProgress,
  installWithProgress: install.installWithProgress,
};
