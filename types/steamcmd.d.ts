/**
 * TypeScript definitions for steamcmd
 * Node.js wrapper for SteamCMD - download, install, and manage Steam applications programmatically
 */

import { EventEmitter } from "events";

/**
 * Progress information for download/install operations
 */
export interface Progress {
  /** Current phase of the operation */
  phase:
    | "starting"
    | "downloading"
    | "validating"
    | "preallocating"
    | "complete"
    | string;
  /** Percentage complete (0-100) */
  percent: number;
  /** Number of bytes downloaded so far */
  bytesDownloaded: number;
  /** Total bytes to download (0 if unknown) */
  totalBytes: number;
}

/**
 * Options for the install() function
 */
export interface InstallOptions {
  /** Steam application ID to install */
  applicationId?: number | string;
  /** Workshop item ID to install (requires applicationId) */
  workshopId?: number | string;
  /** Installation directory path */
  path?: string;
  /** Steam username for authentication */
  username?: string;
  /** Steam password for authentication */
  password?: string;
  /** Steam Guard code for two-factor authentication */
  steamGuardCode?: string;
  /** Target platform for download ('windows', 'macos', 'linux') */
  platform?: "windows" | "macos" | "linux";
  /**
   * Progress callback fired during download/install operations
   * @param progress - Progress information
   */
  onProgress?: (progress: Progress) => void;
  /**
   * Output callback fired when SteamCMD produces output
   * @param data - Output text
   * @param type - Output stream type ('stdout' or 'stderr')
   */
  onOutput?: (data: string, type: "stdout" | "stderr") => void;
}

/**
 * Options for the download functions
 */
export interface DownloadOptions {
  /**
   * Progress callback fired during download
   * @param progress - Progress information
   */
  onProgress?: (progress: Progress) => void;
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
  platform?: "windows" | "macos" | "linux";
  /** Progress callback */
  onProgress?: (progress: Progress) => void;
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
  onProgress?: (progress: Progress) => void;
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
 * Callback function type for legacy callback-based API
 */
export type InstallCallback = (error: Error | null) => void;

/**
 * Custom error class for SteamCMD operations
 */
export class SteamCmdError extends Error {
  name: "SteamCmdError";
  /** Error code identifying the type of error */
  code: string;
  /** Original error that caused this error */
  cause?: Error;

  constructor(message: string, code: string, cause?: Error);
}

/**
 * Custom error class for download failures
 */
export class DownloadError extends Error {
  name: "DownloadError";
  /** Error code: 'UNSUPPORTED_PLATFORM' | 'DIRECTORY_ERROR' | 'HTTP_ERROR' | 'EXTRACT_ERROR' | 'NETWORK_ERROR' */
  code: string;

  constructor(message: string, code: string);
}

/**
 * Custom error class for installation failures
 */
export class InstallError extends Error {
  name: "InstallError";
  /** Error code: 'INVALID_OPTIONS' | 'INVALID_APP_ID' | 'MISSING_APP_ID' | 'INVALID_WORKSHOP_ID' | 'INVALID_PLATFORM' | 'MISSING_USERNAME' | 'INVALID_PATH' | 'SPAWN_ERROR' | 'EXIT_ERROR' */
  code: string;
  /** Exit code from SteamCMD process (for EXIT_ERROR) */
  exitCode?: number;
  /** Captured stdout from SteamCMD (for EXIT_ERROR) */
  stdout?: string;
  /** Captured stderr from SteamCMD (for EXIT_ERROR) */
  stderr?: string;

  constructor(message: string, code: string, exitCode?: number);
}

/**
 * EventEmitter for download operations with progress events
 */
export interface DownloadEmitter extends EventEmitter {
  on(event: "progress", listener: (progress: Progress) => void): this;
  on(event: "complete", listener: () => void): this;
  on(event: "error", listener: (error: DownloadError) => void): this;

  once(event: "progress", listener: (progress: Progress) => void): this;
  once(event: "complete", listener: () => void): this;
  once(event: "error", listener: (error: DownloadError) => void): this;

  emit(event: "progress", progress: Progress): boolean;
  emit(event: "complete"): boolean;
  emit(event: "error", error: DownloadError): boolean;
}

/**
 * EventEmitter for install operations with progress events
 */
export interface InstallEmitter extends EventEmitter {
  on(event: "progress", listener: (progress: Progress) => void): this;
  on(
    event: "output",
    listener: (data: string, type: "stdout" | "stderr") => void,
  ): this;
  on(event: "complete", listener: () => void): this;
  on(event: "error", listener: (error: InstallError) => void): this;

  once(event: "progress", listener: (progress: Progress) => void): this;
  once(
    event: "output",
    listener: (data: string, type: "stdout" | "stderr") => void,
  ): this;
  once(event: "complete", listener: () => void): this;
  once(event: "error", listener: (error: InstallError) => void): this;

  emit(event: "progress", progress: Progress): boolean;
  emit(event: "output", data: string, type: "stdout" | "stderr"): boolean;
  emit(event: "complete"): boolean;
  emit(event: "error", error: InstallError): boolean;
}

/**
 * Install a Steam application or Workshop item
 *
 * @param options - Installation options
 * @returns Promise that resolves when installation is complete
 *
 * @example
 * // Promise-based usage with progress
 * await steamcmd.install({
 *   applicationId: 740,
 *   path: './server',
 *   onProgress: (p) => console.log(`${p.phase}: ${p.percent}%`)
 * });
 */
export function install(options: InstallOptions): Promise<void>;

/**
 * Install a Steam application or Workshop item (callback-based)
 *
 * @param options - Installation options
 * @param callback - Callback function called when complete
 *
 * @example
 * // Callback-based usage (legacy)
 * steamcmd.install({ applicationId: 740 }, (err) => {
 *   if (err) console.error(err);
 * });
 */
export function install(
  options: InstallOptions,
  callback: InstallCallback,
): void;

/**
 * Check if SteamCMD is installed and executable
 *
 * @returns Promise that resolves to true if SteamCMD is available
 */
export function isInstalled(): Promise<boolean>;

/**
 * Ensure SteamCMD is installed, downloading if necessary
 *
 * @param options - Download options
 * @returns Promise that resolves when SteamCMD is available
 * @throws {SteamCmdError} If download fails
 */
export function ensureInstalled(options?: DownloadOptions): Promise<void>;

/**
 * Get information about the SteamCMD installation
 *
 * @returns Object containing SteamCMD paths and status
 */
export function getInfo(): SteamCmdInfo;

/**
 * Download SteamCMD with EventEmitter-based progress
 *
 * @param options - Download options
 * @returns EventEmitter that fires 'progress', 'error', and 'complete' events
 *
 * @example
 * const emitter = downloadWithProgress();
 * emitter.on('progress', (p) => console.log(`${p.percent}%`));
 * emitter.on('complete', () => console.log('Done!'));
 * emitter.on('error', (err) => console.error(err));
 */
export function downloadWithProgress(
  options?: DownloadOptions,
): DownloadEmitter;

/**
 * Run SteamCMD installation with EventEmitter-based progress
 *
 * @param steamCmdPath - Path to SteamCMD executable
 * @param options - Installation options
 * @returns EventEmitter that fires 'progress', 'output', 'error', and 'complete' events
 *
 * @example
 * const emitter = installWithProgress(execPath, { applicationId: 740 });
 * emitter.on('progress', (p) => console.log(`${p.percent}%`));
 * emitter.on('output', (data, type) => console.log(`[${type}] ${data}`));
 * emitter.on('complete', () => console.log('Done!'));
 * emitter.on('error', (err) => console.error(err));
 */
export function installWithProgress(
  steamCmdPath: string,
  options: InstallOptions,
): InstallEmitter;

/**
 * Get a list of installed Steam applications in a directory
 *
 * @param options - Options with path to scan
 * @returns Promise that resolves to array of installed app information
 *
 * @example
 * const apps = await steamcmd.getInstalledApps({ path: './server' });
 * // [{ appId: 740, name: 'Counter-Strike Global Offensive - Dedicated Server', ... }]
 */
export function getInstalledApps(
  options: GetInstalledAppsOptions,
): Promise<InstalledApp[]>;

/**
 * Update an installed Steam application
 *
 * @param options - Update options including applicationId
 * @returns Promise that resolves when update is complete
 *
 * @example
 * await steamcmd.update({
 *   applicationId: 740,
 *   path: './server',
 *   onProgress: (p) => console.log(`${p.phase}: ${p.percent}%`)
 * });
 */
export function update(options: UpdateOptions): Promise<void>;

/**
 * Validate an installed Steam application
 *
 * @param options - Validation options including applicationId
 * @returns Promise that resolves when validation is complete
 *
 * @example
 * await steamcmd.validate({
 *   applicationId: 740,
 *   path: './server'
 * });
 */
export function validate(options: ValidateOptions): Promise<void>;

/**
 * Get the installed version (build ID) of a Steam application
 *
 * @param options - Options with applicationId and path
 * @returns Promise that resolves to version information or null if not installed
 *
 * @example
 * const version = await steamcmd.getInstalledVersion({
 *   applicationId: 740,
 *   path: './server'
 * });
 * // { appId: 740, buildId: 12345678, lastUpdated: Date }
 */
export function getInstalledVersion(
  options: GetInstalledVersionOptions,
): Promise<InstalledVersion | null>;

/**
 * Operation type for createProgressEmitter
 */
export type OperationType = "install" | "update" | "validate";

/**
 * EventEmitter for general SteamCMD operations with progress events
 */
export interface ProgressEmitter extends EventEmitter {
  on(event: "progress", listener: (progress: Progress) => void): this;
  on(
    event: "output",
    listener: (data: string, type: "stdout" | "stderr") => void,
  ): this;
  on(event: "complete", listener: () => void): this;
  on(event: "error", listener: (error: Error) => void): this;

  once(event: "progress", listener: (progress: Progress) => void): this;
  once(
    event: "output",
    listener: (data: string, type: "stdout" | "stderr") => void,
  ): this;
  once(event: "complete", listener: () => void): this;
  once(event: "error", listener: (error: Error) => void): this;

  emit(event: "progress", progress: Progress): boolean;
  emit(event: "output", data: string, type: "stdout" | "stderr"): boolean;
  emit(event: "complete"): boolean;
  emit(event: "error", error: Error): boolean;
}

/**
 * Create an EventEmitter for SteamCMD operations with real-time progress
 *
 * @param operation - Operation type ('install', 'update', 'validate')
 * @param options - Operation options
 * @returns EventEmitter that fires 'progress', 'output', 'error', and 'complete' events
 *
 * @example
 * const emitter = steamcmd.createProgressEmitter('install', { applicationId: 740 });
 * emitter.on('progress', (p) => console.log(`${p.phase}: ${p.percent}%`));
 * emitter.on('output', (data, type) => console.log(`[${type}] ${data}`));
 * emitter.on('complete', () => console.log('Done!'));
 * emitter.on('error', (err) => console.error(err));
 */
export function createProgressEmitter(
  operation: OperationType,
  options: InstallOptions,
): ProgressEmitter;
