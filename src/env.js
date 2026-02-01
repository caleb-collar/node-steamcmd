/**
 * @module steamcmd/env
 * @description Platform detection and path resolution for SteamCMD
 * @private
 */

const os = require("os");
const path = require("path");
const envPaths = require("env-paths");

const paths = envPaths("steamcmd", { suffix: "" });

/**
 * Supported platforms for SteamCMD
 */
const SUPPORTED_PLATFORMS = ["linux", "darwin", "win32"];

/**
 * Get the SteamCMD installation directory
 * @returns {string} Path to the SteamCMD directory
 */
function directory() {
  return paths.data;
}

/**
 * Get the current platform
 * @returns {string} The current OS platform
 */
function platform() {
  return os.platform();
}

/**
 * Check if the current platform is supported
 * @returns {boolean} True if platform is supported
 */
function isPlatformSupported() {
  return SUPPORTED_PLATFORMS.includes(platform());
}

/**
 * Get the path to the SteamCMD executable
 * @returns {string|null} Path to executable or null if unsupported platform
 */
function executable() {
  const plat = platform();

  if (plat === "linux" || plat === "darwin") {
    return path.resolve(directory(), "steamcmd.sh");
  }

  if (plat === "win32") {
    return path.resolve(directory(), "steamcmd.exe");
  }

  return null;
}

module.exports = {
  directory,
  executable,
  platform,
  isPlatformSupported,
  SUPPORTED_PLATFORMS,
};
