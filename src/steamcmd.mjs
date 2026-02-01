/**
 * @module steamcmd
 * @description ESM wrapper for steamcmd module
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const steamcmd = require("./steamcmd.js");

// Named exports
export const install = steamcmd.install;
export const isInstalled = steamcmd.isInstalled;
export const ensureInstalled = steamcmd.ensureInstalled;
export const getInfo = steamcmd.getInfo;
export const SteamCmdError = steamcmd.SteamCmdError;
export const DownloadError = steamcmd.DownloadError;
export const InstallError = steamcmd.InstallError;
export const downloadWithProgress = steamcmd.downloadWithProgress;
export const installWithProgress = steamcmd.installWithProgress;
export const getInstalledApps = steamcmd.getInstalledApps;
export const update = steamcmd.update;
export const validate = steamcmd.validate;
export const getInstalledVersion = steamcmd.getInstalledVersion;
export const createProgressEmitter = steamcmd.createProgressEmitter;

// Default export
export default steamcmd;
