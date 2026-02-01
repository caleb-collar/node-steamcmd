/**
 * @module steamcmd/download
 * @description Downloads and extracts SteamCMD for the current platform
 * @private
 */

import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import https from 'node:https'
import tar from 'tar'
import unzip from 'unzipper'
import * as env from './env.js'

/**
 * Progress information for download operations
 */
export interface DownloadProgress {
  /** Current phase of the operation */
  phase: 'starting' | 'downloading' | 'complete'
  /** Percentage complete (0-100) */
  percent: number
  /** Number of bytes downloaded so far */
  bytesDownloaded: number
  /** Total bytes to download (0 if unknown) */
  totalBytes: number
}

/**
 * Options for download operations
 */
export interface DownloadOptions {
  /** Progress callback fired during download */
  onProgress?: (progress: DownloadProgress) => void
}

/**
 * Callback function type for download operations
 */
export type DownloadCallback = (error: Error | null) => void

/**
 * SteamCMD download URLs by platform
 */
export const DOWNLOAD_URLS: Record<string, string> = {
  darwin:
    'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_osx.tar.gz',
  linux:
    'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz',
  win32: 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip',
}

/**
 * Custom error class for download failures
 */
export class DownloadError extends Error {
  name = 'DownloadError' as const
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.code = code
  }
}

/**
 * EventEmitter for download operations with progress events
 */
export interface DownloadEmitter extends EventEmitter {
  on(event: 'progress', listener: (progress: DownloadProgress) => void): this
  on(event: 'complete', listener: () => void): this
  on(event: 'error', listener: (error: DownloadError) => void): this
  once(event: 'progress', listener: (progress: DownloadProgress) => void): this
  once(event: 'complete', listener: () => void): this
  once(event: 'error', listener: (error: DownloadError) => void): this
  emit(event: 'progress', progress: DownloadProgress): boolean
  emit(event: 'complete'): boolean
  emit(event: 'error', error: DownloadError): boolean
}

/**
 * Download and extract SteamCMD for the current platform
 * @param options Download options
 * @param callback Optional callback. If omitted, returns a Promise.
 * @returns Promise if no callback provided
 *
 * @example
 * // With progress callback
 * await download({
 *   onProgress: (progress) => {
 *     console.log(`${progress.phase}: ${progress.percent}%`);
 *   }
 * });
 */
export function download(
  options?: DownloadOptions | DownloadCallback,
  callback?: DownloadCallback
): Promise<void> | void {
  // Handle legacy signature: download(callback)
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  options = options || {}

  // Support Promise-based usage
  if (typeof callback !== 'function') {
    return new Promise((resolve, reject) => {
      download(options, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  const onProgress =
    typeof options.onProgress === 'function' ? options.onProgress : () => {}

  const platformValue = env.platform()
  const url = DOWNLOAD_URLS[platformValue]
  const destDir = env.directory()

  if (!url) {
    callback(
      new DownloadError(
        `Unsupported platform: ${platformValue}`,
        'UNSUPPORTED_PLATFORM'
      )
    )
    return
  }

  // Ensure destination directory exists
  try {
    fs.mkdirSync(destDir, { recursive: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    callback(
      new DownloadError(
        `Failed to create directory ${destDir}: ${message}`,
        'DIRECTORY_ERROR'
      )
    )
    return
  }

  onProgress({
    phase: 'starting',
    percent: 0,
    bytesDownloaded: 0,
    totalBytes: 0,
  })

  https
    .get(url, (res) => {
      if (res.statusCode !== 200) {
        callback!(
          new DownloadError(
            `Failed to download SteamCMD: HTTP ${res.statusCode}`,
            'HTTP_ERROR'
          )
        )
        return
      }

      const totalBytes = parseInt(res.headers['content-length'] || '0', 10)
      let bytesDownloaded = 0

      res.on('data', (chunk: Buffer) => {
        bytesDownloaded += chunk.length
        const percent =
          totalBytes > 0 ? Math.round((bytesDownloaded / totalBytes) * 100) : 0
        onProgress({
          phase: 'downloading',
          percent,
          bytesDownloaded,
          totalBytes,
        })
      })

      if (platformValue === 'darwin' || platformValue === 'linux') {
        res
          .pipe(tar.x({ cwd: destDir }))
          .on('error', (err: Error) => {
            callback!(
              new DownloadError(
                `Failed to extract tar archive: ${err.message}`,
                'EXTRACT_ERROR'
              )
            )
          })
          .on('finish', () => {
            onProgress({
              phase: 'complete',
              percent: 100,
              bytesDownloaded,
              totalBytes,
            })
            callback!(null)
          })
      } else if (platformValue === 'win32') {
        res
          .pipe(unzip.Extract({ path: destDir }))
          .on('error', (err: Error) => {
            callback!(
              new DownloadError(
                `Failed to extract zip archive: ${err.message}`,
                'EXTRACT_ERROR'
              )
            )
          })
          .on('close', () => {
            onProgress({
              phase: 'complete',
              percent: 100,
              bytesDownloaded,
              totalBytes,
            })
            callback!(null)
          })
      }
    })
    .on('error', (err) => {
      callback!(
        new DownloadError(`Network error: ${err.message}`, 'NETWORK_ERROR')
      )
    })
}

/**
 * Download SteamCMD with EventEmitter-based progress
 * @param options Download options
 * @returns Emitter that fires 'progress', 'error', and 'complete' events
 *
 * @example
 * const emitter = downloadWithProgress();
 * emitter.on('progress', (p) => console.log(`${p.percent}%`));
 * emitter.on('complete', () => console.log('Done!'));
 * emitter.on('error', (err) => console.error(err));
 */
export function downloadWithProgress(
  options?: DownloadOptions
): DownloadEmitter {
  const emitter = new EventEmitter() as DownloadEmitter

  // Run download in next tick to allow event binding
  process.nextTick(() => {
    download(
      {
        ...options,
        onProgress: (progress) => emitter.emit('progress', progress),
      },
      (err) => {
        if (err) {
          emitter.emit('error', err as DownloadError)
        } else {
          emitter.emit('complete')
        }
      }
    )
  })

  return emitter
}

export default download
