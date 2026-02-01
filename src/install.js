/**
 * @module steamcmd/install
 * @description Spawns SteamCMD processes to install applications and workshop items
 * @private
 */

const childProcess = require('child_process')
const { EventEmitter } = require('events')

/**
 * Custom error class for installation failures
 * @extends Error
 */
class InstallError extends Error {
  constructor (message, code, exitCode) {
    super(message)
    this.name = 'InstallError'
    this.code = code
    this.exitCode = exitCode
  }
}

/**
 * Validate installation options
 * @param {Object} options - Installation options
 * @throws {InstallError} If options are invalid
 */
function validateOptions (options) {
  if (!options || typeof options !== 'object') {
    throw new InstallError('Options must be an object', 'INVALID_OPTIONS')
  }

  if (options.applicationId !== undefined) {
    const appId = Number(options.applicationId)
    if (isNaN(appId) || appId <= 0 || !Number.isInteger(appId)) {
      throw new InstallError(
        'applicationId must be a positive integer',
        'INVALID_APP_ID'
      )
    }
  }

  if (options.workshopId !== undefined) {
    if (!options.applicationId) {
      throw new InstallError(
        'workshopId requires applicationId to be specified',
        'MISSING_APP_ID'
      )
    }
    const workshopId = Number(options.workshopId)
    if (isNaN(workshopId) || workshopId <= 0 || !Number.isInteger(workshopId)) {
      throw new InstallError(
        'workshopId must be a positive integer',
        'INVALID_WORKSHOP_ID'
      )
    }
  }

  if (options.platform !== undefined) {
    const validPlatforms = ['windows', 'macos', 'linux']
    if (!validPlatforms.includes(options.platform)) {
      throw new InstallError(
        `platform must be one of: ${validPlatforms.join(', ')}`,
        'INVALID_PLATFORM'
      )
    }
  }

  if (options.password && !options.username) {
    throw new InstallError(
      'password requires username to be specified',
      'MISSING_USERNAME'
    )
  }

  if (options.steamGuardCode && !options.username) {
    throw new InstallError(
      'steamGuardCode requires username to be specified',
      'MISSING_USERNAME'
    )
  }
}

/**
 * Build SteamCMD command line arguments
 * @param {Object} options - Installation options
 * @returns {string[]} Array of command line arguments
 */
function createArguments (options) {
  const args = []

  // Force platform type for download
  if (options.platform) {
    args.push('+@sSteamCmdForcePlatformType ' + options.platform)
  }

  // Use supplied password
  args.push('+@NoPromptForPassword 1')

  // Quit on fail
  args.push('+@ShutdownOnFailedCommand 1')

  if (options.steamGuardCode) {
    args.push('+set_steam_guard_code ' + options.steamGuardCode)
  }

  // Authentication
  if (options.username && options.password) {
    args.push('+login ' + options.username + ' ' + options.password)
  } else if (options.username) {
    args.push('+login ' + options.username)
  } else {
    args.push('+login anonymous')
  }

  // Installation directory
  if (options.path) {
    args.push('+force_install_dir "' + options.path + '"')
  }

  // App id to install and/or validate
  if (options.applicationId && !options.workshopId) {
    args.push('+app_update ' + options.applicationId + ' validate')
  }

  // Workshop id to install and/or validate
  if (options.applicationId && options.workshopId) {
    args.push(
      '+workshop_download_item ' +
        options.applicationId +
        ' ' +
        options.workshopId
    )
  }

  // Quit when done
  args.push('+quit')

  return args
}

/**
 * Parse SteamCMD output for progress information
 * @param {string} data - Raw output from SteamCMD
 * @returns {Object|null} Parsed progress info or null if not progress data
 */
function parseProgress (data) {
  const str = data.toString()

  // Match update/download progress: "Update state (0x61) downloading, progress: 45.23 (1234567890 / 2732853760)"
  const updateMatch = str.match(
    /Update state \(0x[\da-f]+\) (\w+), progress: ([\d.]+) \((\d+) \/ (\d+)\)/i
  )
  if (updateMatch) {
    return {
      phase: updateMatch[1].toLowerCase(),
      percent: Math.round(parseFloat(updateMatch[2])),
      bytesDownloaded: parseInt(updateMatch[3], 10),
      totalBytes: parseInt(updateMatch[4], 10)
    }
  }

  // Match validation progress: "Validating: 45%"
  const validateMatch = str.match(/Validating[^\d]*(\d+)%/i)
  if (validateMatch) {
    return {
      phase: 'validating',
      percent: parseInt(validateMatch[1], 10),
      bytesDownloaded: 0,
      totalBytes: 0
    }
  }

  // Match download progress: "[####    ] 45%"
  const percentMatch = str.match(/\[(#+\s*)\]\s*(\d+)%/i)
  if (percentMatch) {
    return {
      phase: 'downloading',
      percent: parseInt(percentMatch[2], 10),
      bytesDownloaded: 0,
      totalBytes: 0
    }
  }

  return null
}

/**
 * Run SteamCMD with the given options
 * @param {string} steamCmdPath - Path to SteamCMD executable
 * @param {Object} options - Installation options
 * @param {Function} [options.onProgress] - Progress callback(progress) with { phase, percent, bytesDownloaded, totalBytes }
 * @param {Function} [options.onOutput] - Output callback(data, type) where type is 'stdout' or 'stderr'
 * @param {Function} [callback] - Optional callback(err). If omitted, returns a Promise.
 * @returns {Promise<void>|undefined} Promise if no callback provided
 *
 * @example
 * // With progress callback
 * await install(execPath, {
 *   applicationId: 740,
 *   onProgress: (p) => console.log(`${p.phase}: ${p.percent}%`),
 *   onOutput: (data, type) => console.log(`[${type}] ${data}`)
 * });
 */
function install (steamCmdPath, options, callback) {
  // Support Promise-based usage
  if (typeof callback !== 'function') {
    return new Promise((resolve, reject) => {
      install(steamCmdPath, options, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  // Validate options
  try {
    validateOptions(options)
  } catch (err) {
    callback(err)
    return
  }

  // Validate steamCmdPath
  if (!steamCmdPath || typeof steamCmdPath !== 'string') {
    callback(
      new InstallError(
        'steamCmdPath must be a non-empty string',
        'INVALID_PATH'
      )
    )
    return
  }

  const onProgress =
    typeof options.onProgress === 'function' ? options.onProgress : () => {}
  const onOutput =
    typeof options.onOutput === 'function' ? options.onOutput : null

  const proc = childProcess.execFile(steamCmdPath, createArguments(options))

  let stdoutData = ''
  let stderrData = ''

  onProgress({
    phase: 'starting',
    percent: 0,
    bytesDownloaded: 0,
    totalBytes: 0
  })

  proc.stdout.on('data', (data) => {
    stdoutData += data
    if (onOutput) {
      onOutput(data.toString(), 'stdout')
    } else {
      console.log('stdout: ' + data)
    }

    // Parse progress from output
    const progress = parseProgress(data)
    if (progress) {
      onProgress(progress)
    }
  })

  proc.stderr.on('data', (data) => {
    stderrData += data
    if (onOutput) {
      onOutput(data.toString(), 'stderr')
    } else {
      console.log('stderr: ' + data)
    }
  })

  proc.on('error', (err) => {
    callback(
      new InstallError(
        `Failed to spawn SteamCMD: ${err.message}`,
        'SPAWN_ERROR'
      )
    )
  })

  proc.on('close', (code) => {
    if (onOutput) {
      onOutput(`Process exited with code ${code}\n`, 'stdout')
    } else {
      console.log('child process exited with code ' + code)
    }

    if (code > 0) {
      const err = new InstallError(
        `SteamCMD exited with code ${code}`,
        'EXIT_ERROR',
        code
      )
      err.stdout = stdoutData
      err.stderr = stderrData
      callback(err)
    } else {
      onProgress({
        phase: 'complete',
        percent: 100,
        bytesDownloaded: 0,
        totalBytes: 0
      })
      callback(null)
    }
  })
}

/**
 * Run SteamCMD with EventEmitter-based progress
 * @param {string} steamCmdPath - Path to SteamCMD executable
 * @param {Object} options - Installation options
 * @returns {EventEmitter} Emitter that fires 'progress', 'output', 'error', and 'complete' events
 *
 * @example
 * const emitter = installWithProgress(execPath, { applicationId: 740 });
 * emitter.on('progress', (p) => console.log(`${p.percent}%`));
 * emitter.on('output', (data, type) => console.log(`[${type}] ${data}`));
 * emitter.on('complete', () => console.log('Done!'));
 * emitter.on('error', (err) => console.error(err));
 */
function installWithProgress (steamCmdPath, options) {
  const emitter = new EventEmitter()

  // Run install in next tick to allow event binding
  process.nextTick(() => {
    install(
      steamCmdPath,
      {
        ...options,
        onProgress: (progress) => emitter.emit('progress', progress),
        onOutput: (data, type) => emitter.emit('output', data, type)
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

module.exports = install
module.exports.installWithProgress = installWithProgress
module.exports.createArguments = createArguments
module.exports.validateOptions = validateOptions
module.exports.parseProgress = parseProgress
module.exports.InstallError = InstallError
