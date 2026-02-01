/**
 * @module steamcmd
 * @description Node.js wrapper for SteamCMD - download, install, and manage Steam applications
 * @author Björn Dahlgren
 * @license MIT
 * @see https://github.com/dahlgren/node-steamcmd
 */

import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

import download, {
  type DownloadEmitter,
  DownloadError,
  type DownloadOptions,
  type DownloadProgress,
  downloadWithProgress,
} from "./download.js";
import * as env from "./env.js";
import install, {
  type InstallEmitter,
  InstallError,
  type InstallOptions,
  type InstallProgress,
  installWithProgress,
  type SteamPlatform,
} from "./install.js";

const access = promisify(fs.access);
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

/**
 * Custom error class for SteamCMD operations
 */
export class SteamCmdError extends Error {
  name = "SteamCmdError" as const;
  code: string;
  cause?: Error;

  constructor(message: string, code: string, cause?: Error) {
    super(message);
    this.code = code;
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Options for getInstalledApps() function
 */
export interface GetInstalledAppsOptions {
  /** Installation directory to scan */
  path: string;
}

/**
 * Information about an installed Steam application
 */
export interface InstalledApp {
  /** Steam application ID */
  appId: number;
  /** Application name */
  name: string;
  /** Installation directory name */
  installDir: string | null;
  /** Size on disk in bytes */
  sizeOnDisk: number;
  /** Build ID (version) */
  buildId: number;
  /** Last update timestamp */
  lastUpdated: Date | null;
  /** State flags */
  state: number;
}

/**
 * Options for update() function
 */
export interface UpdateOptions {
  /** Steam application ID to update */
  applicationId: number | string;
  /** Installation directory path */
  path?: string;
  /** Steam username for authentication */
  username?: string;
  /** Steam password for authentication */
  password?: string;
  /** Steam Guard code for two-factor authentication */
  steamGuardCode?: string;
  /** Target platform for download */
  platform?: SteamPlatform;
  /** Progress callback */
  onProgress?: (progress: InstallProgress) => void;
  /** Output callback */
  onOutput?: (data: string, type: "stdout" | "stderr") => void;
}

/**
 * Options for validate() function
 */
export interface ValidateOptions {
  /** Steam application ID to validate */
  applicationId: number | string;
  /** Installation directory path */
  path?: string;
  /** Steam username for authentication */
  username?: string;
  /** Steam password for authentication */
  password?: string;
  /** Steam Guard code for two-factor authentication */
  steamGuardCode?: string;
  /** Progress callback */
  onProgress?: (progress: InstallProgress) => void;
  /** Output callback */
  onOutput?: (data: string, type: "stdout" | "stderr") => void;
}

/**
 * Options for getInstalledVersion() function
 */
export interface GetInstalledVersionOptions {
  /** Steam application ID */
  applicationId: number | string;
  /** Installation directory path */
  path: string;
}

/**
 * Version information for an installed application
 */
export interface InstalledVersion {
  /** Steam application ID */
  appId: number;
  /** Application name */
  name: string;
  /** Build ID (version) */
  buildId: number;
  /** Last update timestamp */
  lastUpdated: Date | null;
}

/**
 * Information about the SteamCMD installation
 */
export interface SteamCmdInfo {
  /** Directory where SteamCMD is installed */
  directory: string;
  /** Path to the SteamCMD executable, or null if unsupported platform */
  executable: string | null;
  /** Current platform identifier */
  platform: NodeJS.Platform;
  /** Whether the current platform is supported */
  isSupported: boolean;
}

/**
 * Callback function type for install operations
 */
export type InstallCallback = (error: Error | null) => void;

/**
 * Operation type for createProgressEmitter
 */
export type OperationType = "install" | "update" | "validate";

/**
 * EventEmitter for general SteamCMD operations with progress events
 */
export interface ProgressEmitter extends EventEmitter {
  on(
    event: "progress",
    listener: (progress: InstallProgress | DownloadProgress) => void,
  ): this;
  on(
    event: "output",
    listener: (data: string, type: "stdout" | "stderr") => void,
  ): this;
  on(event: "complete", listener: () => void): this;
  on(event: "error", listener: (error: Error) => void): this;
  once(
    event: "progress",
    listener: (progress: InstallProgress | DownloadProgress) => void,
  ): this;
  once(
    event: "output",
    listener: (data: string, type: "stdout" | "stderr") => void,
  ): this;
  once(event: "complete", listener: () => void): this;
  once(event: "error", listener: (error: Error) => void): this;
  emit(
    event: "progress",
    progress: InstallProgress | DownloadProgress,
  ): boolean;
  emit(event: "output", data: string, type: "stdout" | "stderr"): boolean;
  emit(event: "complete"): boolean;
  emit(event: "error", error: Error): boolean;
}

/**
 * Check if SteamCMD is installed and executable
 * @returns True if SteamCMD is available
 */
export async function isInstalled(): Promise<boolean> {
  const executablePath = env.executable();
  if (!executablePath) return false;

  try {
    await access(executablePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure SteamCMD is installed, downloading if necessary
 * @param options Download options
 * @throws {SteamCmdError} If download fails
 */
export async function ensureInstalled(
  options?: DownloadOptions,
): Promise<void> {
  const opts = options || {};
  const installed = await isInstalled();
  if (installed) return;

  console.log("SteamCMD needs to be installed");

  try {
    await download({ onProgress: opts.onProgress });
    console.log("SteamCMD was installed");
  } catch (err) {
    throw new SteamCmdError(
      "Failed to install SteamCMD",
      "INSTALL_FAILED",
      err instanceof Error ? err : undefined,
    );
  }
}

/**
 * Async implementation of install
 * @private
 */
async function steamCmdInstallAsync(options: InstallOptions): Promise<void> {
  // Validate options early
  if (!options || typeof options !== "object") {
    throw new SteamCmdError("Options must be an object", "INVALID_OPTIONS");
  }

  // Ensure SteamCMD is installed (pass download progress)
  await ensureInstalled({
    onProgress: options.onProgress as (progress: DownloadProgress) => void,
  });

  // Run installation
  const executablePath = env.executable();
  if (!executablePath) {
    throw new SteamCmdError("Platform not supported", "UNSUPPORTED_PLATFORM");
  }

  try {
    await install(executablePath, options);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new SteamCmdError(
      `Installation failed: ${message}`,
      "RUN_FAILED",
      err instanceof Error ? err : undefined,
    );
  }
}

/**
 * Install a Steam application or Workshop item
 *
 * @param options Installation options
 * @param callback Optional callback. If omitted, returns a Promise.
 * @returns Promise if no callback provided
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
export function steamCmdInstall(
  options: InstallOptions,
  callback?: InstallCallback,
): Promise<void> | void {
  // Support Promise-based usage
  if (typeof callback !== "function") {
    return steamCmdInstallAsync(options);
  }

  // Legacy callback-based usage
  steamCmdInstallAsync(options)
    .then(() => callback(null))
    .catch((err: Error) => callback(err));
}

/**
 * Get information about the SteamCMD installation
 * @returns SteamCMD paths and status
 */
export function getInfo(): SteamCmdInfo {
  return {
    directory: env.directory(),
    executable: env.executable(),
    platform: env.platform(),
    isSupported: env.isPlatformSupported(),
  };
}

/**
 * Parse Steam app manifest file (.acf)
 * @param manifestPath Path to the manifest file
 * @returns Parsed manifest data
 * @private
 */
async function parseAppManifest(
  manifestPath: string,
): Promise<Record<string, string>> {
  const content = await readFile(manifestPath, "utf8");
  const result: Record<string, string> = {};

  // Simple VDF parser for app manifests
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/"(\w+)"\s+"([^"]*)"/);
    if (match?.[1] && match[2] !== undefined) {
      result[match[1]] = match[2];
    }
  }

  return result;
}

/**
 * Get a list of installed Steam applications in a directory
 * @param options Options with path to scan
 * @returns Array of installed app information
 *
 * @example
 * const apps = await steamcmd.getInstalledApps({ path: './server' });
 * // [{ appId: 740, name: 'Counter-Strike Global Offensive - Dedicated Server', ... }]
 */
export async function getInstalledApps(
  options: GetInstalledAppsOptions,
): Promise<InstalledApp[]> {
  if (!options || !options.path) {
    throw new SteamCmdError("path option is required", "INVALID_OPTIONS");
  }

  const steamappsDir = path.join(options.path, "steamapps");
  const apps: InstalledApp[] = [];

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
          appId: parseInt(manifest["appid"] || "0", 10),
          name: manifest["name"] || "Unknown",
          installDir: manifest["installdir"] || null,
          sizeOnDisk: parseInt(manifest["SizeOnDisk"] || "0", 10),
          buildId: parseInt(manifest["buildid"] || "0", 10),
          lastUpdated: manifest["LastUpdated"]
            ? new Date(parseInt(manifest["LastUpdated"], 10) * 1000)
            : null,
          state: parseInt(manifest["StateFlags"] || "0", 10),
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
 * @param options Update options
 *
 * @example
 * await steamcmd.update({
 *   applicationId: 740,
 *   path: './server',
 *   onProgress: (p) => console.log(`${p.phase}: ${p.percent}%`)
 * });
 */
export async function update(options: UpdateOptions): Promise<void> {
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
 * @param options Validation options
 *
 * @example
 * await steamcmd.validate({
 *   applicationId: 740,
 *   path: './server'
 * });
 */
export async function validate(options: ValidateOptions): Promise<void> {
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
 * @param options Options with applicationId and path
 * @returns Version information or null if not installed
 *
 * @example
 * const version = await steamcmd.getInstalledVersion({
 *   applicationId: 740,
 *   path: './server'
 * });
 * // { appId: 740, buildId: 12345678, lastUpdated: Date }
 */
export async function getInstalledVersion(
  options: GetInstalledVersionOptions,
): Promise<InstalledVersion | null> {
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
      appId: parseInt(manifest["appid"] || "0", 10),
      name: manifest["name"] || "Unknown",
      buildId: parseInt(manifest["buildid"] || "0", 10),
      lastUpdated: manifest["LastUpdated"]
        ? new Date(parseInt(manifest["LastUpdated"], 10) * 1000)
        : null,
    };
  } catch {
    return null;
  }
}

/**
 * Create an EventEmitter for SteamCMD operations with real-time progress
 * @param _operation Operation type ('install', 'update', 'validate')
 * @param options Operation options
 * @returns Emitter that fires 'progress', 'output', 'error', and 'complete' events
 *
 * @example
 * const emitter = steamcmd.createProgressEmitter('install', { applicationId: 740 });
 * emitter.on('progress', (p) => console.log(`${p.phase}: ${p.percent}%`));
 * emitter.on('output', (data, type) => console.log(`[${type}] ${data}`));
 * emitter.on('complete', () => console.log('Done!'));
 * emitter.on('error', (err) => console.error(err));
 */
export function createProgressEmitter(
  _operation: OperationType,
  options: InstallOptions,
): ProgressEmitter {
  const emitter = new EventEmitter() as ProgressEmitter;

  process.nextTick(async () => {
    try {
      // Ensure SteamCMD is installed first
      await ensureInstalled({
        onProgress: (progress) => emitter.emit("progress", progress),
      });

      // Run the operation
      const executablePath = env.executable();
      if (!executablePath) {
        throw new SteamCmdError(
          "Platform not supported",
          "UNSUPPORTED_PLATFORM",
        );
      }

      const operationOptions: InstallOptions = {
        ...options,
        onProgress: (progress) => emitter.emit("progress", progress),
        onOutput: (data, type) => emitter.emit("output", data, type),
      };

      await install(executablePath, operationOptions);
      emitter.emit("complete");
    } catch (err) {
      emitter.emit(
        "error",
        err instanceof Error ? err : new Error(String(err)),
      );
    }
  });

  return emitter;
}

// Default export for CommonJS compatibility
export default {
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
  DownloadError,
  InstallError,
  // Re-export progress helpers
  downloadWithProgress,
  installWithProgress,
};

// Named exports for ES modules
export {
  steamCmdInstall as install,
  downloadWithProgress,
  installWithProgress,
  DownloadError,
  InstallError,
};

// Re-export types
export type {
  DownloadOptions,
  DownloadProgress,
  DownloadEmitter,
  InstallOptions,
  InstallProgress,
  InstallEmitter,
  SteamPlatform,
};
