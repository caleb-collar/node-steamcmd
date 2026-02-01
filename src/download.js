/**
 * @module steamcmd/download
 * @description Downloads and extracts SteamCMD for the current platform
 * @private
 */

const https = require('https')
const fs = require('fs')
const tar = require('tar')
const unzip = require('unzipper')
const { EventEmitter } = require('events')

const env = require('./env')

/**
 * SteamCMD download URLs by platform
 */
const DOWNLOAD_URLS = {
  darwin:
    'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_osx.tar.gz',
  linux:
    'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz',
  win32: 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip'
}

/**
 * Custom error class for download failures
 */
class DownloadError extends Error {
  constructor (message, code) {
    super(message)
    this.name = 'DownloadError'
    this.code = code
  }
}

/**
 * Download and extract SteamCMD for the current platform
 * @param {Object} [options] - Download options
 * @param {Function} [options.onProgress] - Progress callback(progress) with { phase, percent, bytesDownloaded, totalBytes }
 * @param {Function} [callback] - Optional callback(err). If omitted, returns a Promise.
 * @returns {Promise<void>|undefined} Promise if no callback provided
 *
 * @example
 * // With progress callback
 * await download({
 *   onProgress: (progress) => {
 *     console.log(`${progress.phase}: ${progress.percent}%`);
 *   }
 * });
 */
function download (options, callback) {
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

  const platform = env.platform()
  const url = DOWNLOAD_URLS[platform]
  const destDir = env.directory()

  if (!url) {
    callback(
      new DownloadError(
        `Unsupported platform: ${platform}`,
        'UNSUPPORTED_PLATFORM'
      )
    )
    return
  }

  // Ensure destination directory exists
  try {
    fs.mkdirSync(destDir, { recursive: true })
  } catch (err) {
    callback(
      new DownloadError(
        `Failed to create directory ${destDir}: ${err.message}`,
        'DIRECTORY_ERROR'
      )
    )
    return
  }

  onProgress({
    phase: 'starting',
    percent: 0,
    bytesDownloaded: 0,
    totalBytes: 0
  })

  https
    .get(url, (res) => {
      if (res.statusCode !== 200) {
        callback(
          new DownloadError(
            `Failed to download SteamCMD: HTTP ${res.statusCode}`,
            'HTTP_ERROR'
          )
        )
        return
      }

      const totalBytes = parseInt(res.headers['content-length'], 10) || 0
      let bytesDownloaded = 0

      res.on('data', (chunk) => {
        bytesDownloaded += chunk.length
        const percent =
          totalBytes > 0 ? Math.round((bytesDownloaded / totalBytes) * 100) : 0
        onProgress({
          phase: 'downloading',
          percent,
          bytesDownloaded,
          totalBytes
        })
      })

      if (platform === 'darwin' || platform === 'linux') {
        res
          .pipe(tar.x({ cwd: destDir }))
          .on('error', (err) => {
            callback(
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
              totalBytes
            })
            callback(null)
          })
      } else if (platform === 'win32') {
        res
          .pipe(unzip.Extract({ path: destDir }))
          .on('error', (err) => {
            callback(
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
              totalBytes
            })
            callback(null)
          })
      }
    })
    .on('error', (err) => {
      callback(
        new DownloadError(`Network error: ${err.message}`, 'NETWORK_ERROR')
      )
    })
}

/**
 * Download SteamCMD with EventEmitter-based progress
 * @param {Object} [options] - Download options
 * @returns {EventEmitter} Emitter that fires 'progress', 'error', and 'complete' events
 *
 * @example
 * const emitter = downloadWithProgress();
 * emitter.on('progress', (p) => console.log(`${p.percent}%`));
 * emitter.on('complete', () => console.log('Done!'));
 * emitter.on('error', (err) => console.error(err));
 */
function downloadWithProgress (options) {
  const emitter = new EventEmitter()

  // Run download in next tick to allow event binding
  process.nextTick(() => {
    download(
      {
        ...options,
        onProgress: (progress) => emitter.emit('progress', progress)
      },
      (err) => {
        if (err) {
          emitter.emit('error', err)
        } else {
          emitter.emit('complete')
        }
      }
    )
  })

  return emitter
}

module.exports = download
module.exports.downloadWithProgress = downloadWithProgress
module.exports.DownloadError = DownloadError
module.exports.DOWNLOAD_URLS = DOWNLOAD_URLS
