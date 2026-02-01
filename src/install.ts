/**
 * @module steamcmd/install
 * @description Spawns SteamCMD processes to install applications and workshop items
 * @private
 */

import childProcess from "node:child_process";
import { EventEmitter } from "node:events";

/**
 * Progress information for install operations
 */
export interface InstallProgress {
  /** Current phase of the operation */
  phase: string;
  /** Percentage complete (0-100) */
  percent: number;
  /** Number of bytes downloaded so far */
  bytesDownloaded: number;
  /** Total bytes to download (0 if unknown) */
  totalBytes: number;
}

/**
 * Valid platform values for SteamCMD
 */
export type SteamPlatform = "windows" | "macos" | "linux";

/**
 * Options for install operations
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
  /** Target platform for download */
  platform?: SteamPlatform;
  /** Progress callback */
  onProgress?: (progress: InstallProgress) => void;
  /** Output callback */
  onOutput?: (data: string, type: "stdout" | "stderr") => void;
}

/**
 * Callback function type for install operations
 */
export type InstallCallback = (error: Error | null) => void;

/**
 * Custom error class for installation failures
 */
export class InstallError extends Error {
  name = "InstallError" as const;
  code: string;
  exitCode?: number;
  stdout?: string;
  stderr?: string;

  constructor(message: string, code: string, exitCode?: number) {
    super(message);
    this.code = code;
    this.exitCode = exitCode;
  }
}

/**
 * EventEmitter for install operations with progress events
 */
export interface InstallEmitter extends EventEmitter {
  on(event: "progress", listener: (progress: InstallProgress) => void): this;
  on(
    event: "output",
    listener: (data: string, type: "stdout" | "stderr") => void,
  ): this;
  on(event: "complete", listener: () => void): this;
  on(event: "error", listener: (error: InstallError) => void): this;
  once(event: "progress", listener: (progress: InstallProgress) => void): this;
  once(
    event: "output",
    listener: (data: string, type: "stdout" | "stderr") => void,
  ): this;
  once(event: "complete", listener: () => void): this;
  once(event: "error", listener: (error: InstallError) => void): this;
  emit(event: "progress", progress: InstallProgress): boolean;
  emit(event: "output", data: string, type: "stdout" | "stderr"): boolean;
  emit(event: "complete"): boolean;
  emit(event: "error", error: InstallError): boolean;
}

const VALID_PLATFORMS: readonly SteamPlatform[] = ["windows", "macos", "linux"];

/**
 * Validate installation options
 * @param options Installation options
 * @throws {InstallError} If options are invalid
 */
export function validateOptions(options: unknown): void {
  if (!options || typeof options !== "object") {
    throw new InstallError("Options must be an object", "INVALID_OPTIONS");
  }

  const opts = options as Record<string, unknown>;

  if (opts["applicationId"] !== undefined) {
    const appId = Number(opts["applicationId"]);
    if (Number.isNaN(appId) || appId <= 0 || !Number.isInteger(appId)) {
      throw new InstallError(
        "applicationId must be a positive integer",
        "INVALID_APP_ID",
      );
    }
  }

  if (opts["workshopId"] !== undefined) {
    if (!opts["applicationId"]) {
      throw new InstallError(
        "workshopId requires applicationId to be specified",
        "MISSING_APP_ID",
      );
    }
    const workshopId = Number(opts["workshopId"]);
    if (
      Number.isNaN(workshopId) ||
      workshopId <= 0 ||
      !Number.isInteger(workshopId)
    ) {
      throw new InstallError(
        "workshopId must be a positive integer",
        "INVALID_WORKSHOP_ID",
      );
    }
  }

  if (opts["platform"] !== undefined) {
    if (!VALID_PLATFORMS.includes(opts["platform"] as SteamPlatform)) {
      throw new InstallError(
        `platform must be one of: ${VALID_PLATFORMS.join(", ")}`,
        "INVALID_PLATFORM",
      );
    }
  }

  if (opts["password"] && !opts["username"]) {
    throw new InstallError(
      "password requires username to be specified",
      "MISSING_USERNAME",
    );
  }

  if (opts["steamGuardCode"] && !opts["username"]) {
    throw new InstallError(
      "steamGuardCode requires username to be specified",
      "MISSING_USERNAME",
    );
  }
}

/**
 * Build SteamCMD command line arguments
 * @param options Installation options
 * @returns Array of command line arguments
 */
export function createArguments(options: InstallOptions): string[] {
  const args: string[] = [];

  // Force platform type for download
  if (options.platform) {
    args.push(`+@sSteamCmdForcePlatformType ${options.platform}`);
  }

  // Use supplied password
  args.push("+@NoPromptForPassword 1");

  // Quit on fail
  args.push("+@ShutdownOnFailedCommand 1");

  if (options.steamGuardCode) {
    args.push(`+set_steam_guard_code ${options.steamGuardCode}`);
  }

  // Authentication
  if (options.username && options.password) {
    args.push(`+login ${options.username} ${options.password}`);
  } else if (options.username) {
    args.push(`+login ${options.username}`);
  } else {
    args.push("+login anonymous");
  }

  // Installation directory
  if (options.path) {
    args.push(`+force_install_dir "${options.path}"`);
  }

  // App id to install and/or validate
  if (options.applicationId && !options.workshopId) {
    args.push(`+app_update ${options.applicationId} validate`);
  }

  // Workshop id to install and/or validate
  if (options.applicationId && options.workshopId) {
    args.push(
      "+workshop_download_item " +
        options.applicationId +
        " " +
        options.workshopId,
    );
  }

  // Quit when done
  args.push("+quit");

  return args;
}

/**
 * Parse SteamCMD output for progress information
 * @param data Raw output from SteamCMD
 * @returns Parsed progress info or null if not progress data
 */
export function parseProgress(data: string | Buffer): InstallProgress | null {
  const str = data.toString();

  // Match update/download progress: "Update state (0x61) downloading, progress: 45.23 (1234567890 / 2732853760)"
  const updateMatch = str.match(
    /Update state \(0x[\da-f]+\) (\w+), progress: ([\d.]+) \((\d+) \/ (\d+)\)/i,
  );
  if (updateMatch) {
    return {
      phase: updateMatch[1]!.toLowerCase(),
      percent: Math.round(parseFloat(updateMatch[2]!)),
      bytesDownloaded: parseInt(updateMatch[3]!, 10),
      totalBytes: parseInt(updateMatch[4]!, 10),
    };
  }

  // Match validation progress: "Validating: 45%"
  const validateMatch = str.match(/Validating[^\d]*(\d+)%/i);
  if (validateMatch) {
    return {
      phase: "validating",
      percent: parseInt(validateMatch[1]!, 10),
      bytesDownloaded: 0,
      totalBytes: 0,
    };
  }

  // Match download progress: "[####    ] 45%"
  const percentMatch = str.match(/\[(#+\s*)\]\s*(\d+)%/i);
  if (percentMatch) {
    return {
      phase: "downloading",
      percent: parseInt(percentMatch[2]!, 10),
      bytesDownloaded: 0,
      totalBytes: 0,
    };
  }

  return null;
}

/**
 * Run SteamCMD with the given options
 * @param steamCmdPath Path to SteamCMD executable
 * @param options Installation options
 * @param callback Optional callback. If omitted, returns a Promise.
 * @returns Promise if no callback provided
 *
 * @example
 * // With progress callback
 * await install(execPath, {
 *   applicationId: 740,
 *   onProgress: (p) => console.log(`${p.phase}: ${p.percent}%`),
 *   onOutput: (data, type) => console.log(`[${type}] ${data}`)
 * });
 */
export function install(
  steamCmdPath: string,
  options: InstallOptions,
  callback?: InstallCallback,
): Promise<void> | void {
  // Support Promise-based usage
  if (typeof callback !== "function") {
    return new Promise((resolve, reject) => {
      install(steamCmdPath, options, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Validate options
  try {
    validateOptions(options);
  } catch (err) {
    callback(err as InstallError);
    return;
  }

  // Validate steamCmdPath
  if (!steamCmdPath || typeof steamCmdPath !== "string") {
    callback(
      new InstallError(
        "steamCmdPath must be a non-empty string",
        "INVALID_PATH",
      ),
    );
    return;
  }

  const onProgress =
    typeof options.onProgress === "function" ? options.onProgress : () => {};
  const onOutput =
    typeof options.onOutput === "function" ? options.onOutput : null;

  const proc = childProcess.execFile(steamCmdPath, createArguments(options));

  let stdoutData = "";
  let stderrData = "";

  onProgress({
    phase: "starting",
    percent: 0,
    bytesDownloaded: 0,
    totalBytes: 0,
  });

  proc.stdout?.on("data", (data: Buffer | string) => {
    const str = data.toString();
    stdoutData += str;
    if (onOutput) {
      onOutput(str, "stdout");
    } else {
      console.log(`stdout: ${str}`);
    }

    // Parse progress from output
    const progress = parseProgress(data);
    if (progress) {
      onProgress(progress);
    }
  });

  proc.stderr?.on("data", (data: Buffer | string) => {
    const str = data.toString();
    stderrData += str;
    if (onOutput) {
      onOutput(str, "stderr");
    } else {
      console.log(`stderr: ${str}`);
    }
  });

  proc.on("error", (err) => {
    callback!(
      new InstallError(
        `Failed to spawn SteamCMD: ${err.message}`,
        "SPAWN_ERROR",
      ),
    );
  });

  proc.on("close", (code) => {
    if (onOutput) {
      onOutput(`Process exited with code ${code}\n`, "stdout");
    } else {
      console.log(`child process exited with code ${code}`);
    }

    if (code && code > 0) {
      const err = new InstallError(
        `SteamCMD exited with code ${code}`,
        "EXIT_ERROR",
        code,
      );
      err.stdout = stdoutData;
      err.stderr = stderrData;
      callback!(err);
    } else {
      onProgress({
        phase: "complete",
        percent: 100,
        bytesDownloaded: 0,
        totalBytes: 0,
      });
      callback!(null);
    }
  });
}

/**
 * Run SteamCMD with EventEmitter-based progress
 * @param steamCmdPath Path to SteamCMD executable
 * @param options Installation options
 * @returns Emitter that fires 'progress', 'output', 'error', and 'complete' events
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
): InstallEmitter {
  const emitter = new EventEmitter() as InstallEmitter;

  // Run install in next tick to allow event binding
  process.nextTick(() => {
    install(
      steamCmdPath,
      {
        ...options,
        onProgress: (progress) => emitter.emit("progress", progress),
        onOutput: (data, type) => emitter.emit("output", data, type),
      },
      (err) => {
        if (err) {
          emitter.emit("error", err as InstallError);
        } else {
          emitter.emit("complete");
        }
      },
    );
  });

  return emitter;
}

export default install;
