/**
 * @module steamcmd/env
 * @description Platform detection and path resolution for SteamCMD
 * @private
 */

import os from 'node:os'
import path from 'node:path'
import envPaths from 'env-paths'

const paths = envPaths('steamcmd', { suffix: '' })

/**
 * Supported platforms for SteamCMD
 */
export const SUPPORTED_PLATFORMS: readonly string[] = [
  'linux',
  'darwin',
  'win32',
] as const

/**
 * Get the SteamCMD installation directory
 * @returns Path to the SteamCMD directory
 */
export function directory(): string {
  return paths.data
}

/**
 * Get the current platform
 * @returns The current OS platform
 */
export function platform(): NodeJS.Platform {
  return os.platform()
}

/**
 * Check if the current platform is supported
 * @returns True if platform is supported
 */
export function isPlatformSupported(): boolean {
  return SUPPORTED_PLATFORMS.includes(platform())
}

/**
 * Get the path to the SteamCMD executable
 * @returns Path to executable or null if unsupported platform
 */
export function executable(): string | null {
  const plat = platform()

  if (plat === 'linux' || plat === 'darwin') {
    return path.resolve(directory(), 'steamcmd.sh')
  }

  if (plat === 'win32') {
    return path.resolve(directory(), 'steamcmd.exe')
  }

  return null
}

export default {
  directory,
  executable,
  platform,
  isPlatformSupported,
  SUPPORTED_PLATFORMS,
}
