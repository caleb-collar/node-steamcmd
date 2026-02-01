const fs = require("fs");
const { promisify } = require("util");

const download = require("./download");
const env = require("./env");
const install = require("./install");

const access = promisify(fs.access);

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

module.exports = {
  install: steamCmdInstall,
  isInstalled,
  ensureInstalled,
  getInfo,
  SteamCmdError,
  // Re-export error classes for consumers
  DownloadError: download.DownloadError,
  InstallError: install.InstallError,
  // Re-export progress helpers
  downloadWithProgress: download.downloadWithProgress,
  installWithProgress: install.installWithProgress,
};
