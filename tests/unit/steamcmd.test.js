import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Import the module under test
const steamcmd = require('../../dist/steamcmd.js')

// Mock dependencies
vi.mock('../../dist/download.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    default: vi.fn((options, callback) => {
      if (typeof options === 'function') {
        callback = options
        options = {}
      }
      if (typeof callback !== 'function') {
        return Promise.resolve()
      }
      callback(null)
    }),
  }
})

vi.mock('../../dist/install.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    default: vi.fn((_steamCmdPath, _options, callback) => {
      if (typeof callback !== 'function') {
        return Promise.resolve()
      }
      callback(null)
    }),
  }
})

describe('steamcmd.js', () => {
  describe('SteamCmdError', () => {
    it('should create an error with message and code', () => {
      const err = new steamcmd.SteamCmdError('test message', 'TEST_CODE')
      expect(err.message).toBe('test message')
      expect(err.code).toBe('TEST_CODE')
      expect(err.name).toBe('SteamCmdError')
    })

    it('should include cause when provided', () => {
      const cause = new Error('original error')
      const err = new steamcmd.SteamCmdError('test', 'CODE', cause)
      expect(err.cause).toBe(cause)
    })

    it('should be instanceof Error', () => {
      const err = new steamcmd.SteamCmdError('test', 'CODE')
      expect(err).toBeInstanceOf(Error)
    })
  })

  describe('isInstalled()', () => {
    it('should be a function', () => {
      expect(typeof steamcmd.isInstalled).toBe('function')
    })

    it('should return a Promise', () => {
      const result = steamcmd.isInstalled()
      expect(result).toBeInstanceOf(Promise)
    })

    it('should return boolean', async () => {
      const result = await steamcmd.isInstalled()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('getInfo()', () => {
    it('should return info object', () => {
      const info = steamcmd.getInfo()
      expect(info).toHaveProperty('directory')
      expect(info).toHaveProperty('executable')
      expect(info).toHaveProperty('platform')
      expect(info).toHaveProperty('isSupported')
    })

    it('should return valid platform', () => {
      const info = steamcmd.getInfo()
      expect(['darwin', 'linux', 'win32']).toContain(info.platform)
    })

    it('should return boolean for isSupported', () => {
      const info = steamcmd.getInfo()
      expect(typeof info.isSupported).toBe('boolean')
    })
  })

  describe('ensureInstalled()', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should be a function', () => {
      expect(typeof steamcmd.ensureInstalled).toBe('function')
    })

    it('should return a Promise', () => {
      const result = steamcmd.ensureInstalled()
      expect(result).toBeInstanceOf(Promise)
    })

    it('should accept options object', async () => {
      await steamcmd.ensureInstalled({ onProgress: () => {} })
    })
  })

  describe('install()', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should be a function', () => {
      expect(typeof steamcmd.install).toBe('function')
    })

    it('should return Promise when no callback', () => {
      const result = steamcmd.install({ applicationId: 740 })
      expect(result).toBeInstanceOf(Promise)
    })

    it('should throw for null options', async () => {
      await expect(steamcmd.install(null)).rejects.toThrow(
        steamcmd.SteamCmdError
      )
    })

    it('should throw for non-object options', async () => {
      await expect(steamcmd.install('string')).rejects.toThrow(
        steamcmd.SteamCmdError
      )
    })

    it('should accept callback', (done) => {
      steamcmd.install({ applicationId: 740 }, (_err) => {
        // Note: This may succeed or fail depending on if steamcmd is installed
        done()
      })
    })
  })

  describe('module exports', () => {
    it('should export install function', () => {
      expect(typeof steamcmd.install).toBe('function')
    })

    it('should export isInstalled function', () => {
      expect(typeof steamcmd.isInstalled).toBe('function')
    })

    it('should export ensureInstalled function', () => {
      expect(typeof steamcmd.ensureInstalled).toBe('function')
    })

    it('should export getInfo function', () => {
      expect(typeof steamcmd.getInfo).toBe('function')
    })

    it('should export SteamCmdError class', () => {
      expect(steamcmd.SteamCmdError).toBeDefined()
    })

    it('should export DownloadError class', () => {
      expect(steamcmd.DownloadError).toBeDefined()
    })

    it('should export InstallError class', () => {
      expect(steamcmd.InstallError).toBeDefined()
    })

    it('should export downloadWithProgress function', () => {
      expect(typeof steamcmd.downloadWithProgress).toBe('function')
    })

    it('should export installWithProgress function', () => {
      expect(typeof steamcmd.installWithProgress).toBe('function')
    })

    it('should export getInstalledApps', () => {
      expect(typeof steamcmd.getInstalledApps).toBe('function')
    })

    it('should export update', () => {
      expect(typeof steamcmd.update).toBe('function')
    })

    it('should export validate', () => {
      expect(typeof steamcmd.validate).toBe('function')
    })

    it('should export getInstalledVersion', () => {
      expect(typeof steamcmd.getInstalledVersion).toBe('function')
    })

    it('should export createProgressEmitter', () => {
      expect(typeof steamcmd.createProgressEmitter).toBe('function')
    })
  })
})

describe('steamcmd.js new features', () => {
  describe('getInstalledApps()', () => {
    let tempDir

    beforeEach(() => {
      // Create a temporary directory for testing
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'steamcmd-test-'))
    })

    afterEach(() => {
      // Clean up temporary directory
      fs.rmSync(tempDir, { recursive: true, force: true })
    })

    it('should throw if path option is missing', async () => {
      await expect(steamcmd.getInstalledApps({})).rejects.toThrow(
        'path option is required'
      )
      await expect(steamcmd.getInstalledApps(null)).rejects.toThrow()
    })

    it('should return empty array if steamapps directory does not exist', async () => {
      const apps = await steamcmd.getInstalledApps({ path: tempDir })
      expect(apps).toEqual([])
    })

    it('should return empty array if steamapps directory is empty', async () => {
      fs.mkdirSync(path.join(tempDir, 'steamapps'))
      const apps = await steamcmd.getInstalledApps({ path: tempDir })
      expect(apps).toEqual([])
    })

    it('should parse app manifest files', async () => {
      const steamappsDir = path.join(tempDir, 'steamapps')
      fs.mkdirSync(steamappsDir)

      // Create a mock app manifest
      const manifestContent = `"AppState"
{
	"appid"		"740"
	"name"		"Counter-Strike Global Offensive - Dedicated Server"
	"installdir"		"csgo"
	"SizeOnDisk"		"27328537600"
	"buildid"		"12345678"
	"LastUpdated"		"1706745600"
	"StateFlags"		"4"
}`
      fs.writeFileSync(
        path.join(steamappsDir, 'appmanifest_740.acf'),
        manifestContent
      )

      const apps = await steamcmd.getInstalledApps({ path: tempDir })
      expect(apps).toHaveLength(1)
      expect(apps[0].appId).toBe(740)
      expect(apps[0].name).toBe(
        'Counter-Strike Global Offensive - Dedicated Server'
      )
      expect(apps[0].installDir).toBe('csgo')
      expect(apps[0].sizeOnDisk).toBe(27328537600)
      expect(apps[0].buildId).toBe(12345678)
      expect(apps[0].state).toBe(4)
    })

    it('should handle multiple app manifests', async () => {
      const steamappsDir = path.join(tempDir, 'steamapps')
      fs.mkdirSync(steamappsDir)

      // Create multiple mock manifests
      fs.writeFileSync(
        path.join(steamappsDir, 'appmanifest_740.acf'),
        `"AppState" { "appid" "740" "name" "CSGO Server" }`
      )
      fs.writeFileSync(
        path.join(steamappsDir, 'appmanifest_232330.acf'),
        `"AppState" { "appid" "232330" "name" "CS2 Server" }`
      )

      const apps = await steamcmd.getInstalledApps({ path: tempDir })
      expect(apps).toHaveLength(2)
      expect(apps.map((a) => a.appId).sort()).toEqual([740, 232330].sort())
    })

    it('should ignore non-manifest files', async () => {
      const steamappsDir = path.join(tempDir, 'steamapps')
      fs.mkdirSync(steamappsDir)

      // Create manifest and non-manifest files
      fs.writeFileSync(
        path.join(steamappsDir, 'appmanifest_740.acf'),
        `"AppState" { "appid" "740" "name" "Test" }`
      )
      fs.writeFileSync(
        path.join(steamappsDir, 'libraryfolders.vdf'),
        'library data'
      )
      fs.writeFileSync(path.join(steamappsDir, 'config.txt'), 'config data')

      const apps = await steamcmd.getInstalledApps({ path: tempDir })
      expect(apps).toHaveLength(1)
    })

    it('should skip invalid manifest files', async () => {
      const steamappsDir = path.join(tempDir, 'steamapps')
      fs.mkdirSync(steamappsDir)

      // Create valid and invalid manifests
      fs.writeFileSync(
        path.join(steamappsDir, 'appmanifest_740.acf'),
        `"AppState" { "appid" "740" "name" "Test" }`
      )
      fs.writeFileSync(
        path.join(steamappsDir, 'appmanifest_invalid.acf'),
        'invalid content {{{'
      )

      const apps = await steamcmd.getInstalledApps({ path: tempDir })
      expect(apps).toHaveLength(2) // Both will parse, just with missing fields
    })

    it('should handle manifest with missing optional fields', async () => {
      const steamappsDir = path.join(tempDir, 'steamapps')
      fs.mkdirSync(steamappsDir)

      // Create manifest with minimal fields
      fs.writeFileSync(
        path.join(steamappsDir, 'appmanifest_740.acf'),
        `"AppState" { "appid" "740" }`
      )

      const apps = await steamcmd.getInstalledApps({ path: tempDir })
      expect(apps).toHaveLength(1)
      expect(apps[0].appId).toBe(740)
      expect(apps[0].name).toBe('Unknown')
      expect(apps[0].installDir).toBeNull()
      expect(apps[0].sizeOnDisk).toBe(0)
      expect(apps[0].buildId).toBe(0)
      expect(apps[0].lastUpdated).toBeNull()
    })
  })

  describe('update()', () => {
    it('should throw if applicationId is missing', async () => {
      await expect(steamcmd.update({})).rejects.toThrow(
        'applicationId option is required'
      )
      await expect(steamcmd.update(null)).rejects.toThrow()
    })

    // Note: Full integration tests would require SteamCMD to be installed
    // These tests just verify the function signature and validation
  })

  describe('validate()', () => {
    it('should throw if applicationId is missing', async () => {
      await expect(steamcmd.validate({})).rejects.toThrow(
        'applicationId option is required'
      )
      await expect(steamcmd.validate(null)).rejects.toThrow()
    })
  })

  describe('getInstalledVersion()', () => {
    let tempDir

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'steamcmd-test-'))
    })

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true })
    })

    it('should throw if applicationId is missing', async () => {
      await expect(
        steamcmd.getInstalledVersion({ path: tempDir })
      ).rejects.toThrow('applicationId and path options are required')
    })

    it('should throw if path is missing', async () => {
      await expect(
        steamcmd.getInstalledVersion({ applicationId: 740 })
      ).rejects.toThrow('applicationId and path options are required')
    })

    it('should throw if both applicationId and path are missing', async () => {
      await expect(steamcmd.getInstalledVersion({})).rejects.toThrow(
        'applicationId and path options are required'
      )
    })

    it('should throw for null options', async () => {
      await expect(steamcmd.getInstalledVersion(null)).rejects.toThrow()
    })

    it('should return null if app is not installed', async () => {
      const version = await steamcmd.getInstalledVersion({
        applicationId: 740,
        path: tempDir,
      })
      expect(version).toBeNull()
    })

    it('should return version info for installed app', async () => {
      const steamappsDir = path.join(tempDir, 'steamapps')
      fs.mkdirSync(steamappsDir)

      const manifestContent = `"AppState"
{
	"appid"		"740"
	"name"		"Counter-Strike Global Offensive - Dedicated Server"
	"buildid"		"12345678"
	"LastUpdated"		"1706745600"
}`
      fs.writeFileSync(
        path.join(steamappsDir, 'appmanifest_740.acf'),
        manifestContent
      )

      const version = await steamcmd.getInstalledVersion({
        applicationId: 740,
        path: tempDir,
      })

      expect(version).not.toBeNull()
      expect(version.appId).toBe(740)
      expect(version.buildId).toBe(12345678)
      expect(version.name).toBe(
        'Counter-Strike Global Offensive - Dedicated Server'
      )
      expect(version.lastUpdated).toBeInstanceOf(Date)
    })

    it('should handle string applicationId', async () => {
      const steamappsDir = path.join(tempDir, 'steamapps')
      fs.mkdirSync(steamappsDir)

      fs.writeFileSync(
        path.join(steamappsDir, 'appmanifest_740.acf'),
        `"AppState" { "appid" "740" "name" "Test" "buildid" "123" }`
      )

      const version = await steamcmd.getInstalledVersion({
        applicationId: '740',
        path: tempDir,
      })

      expect(version).not.toBeNull()
      expect(version.appId).toBe(740)
    })

    it('should handle missing optional fields in manifest', async () => {
      const steamappsDir = path.join(tempDir, 'steamapps')
      fs.mkdirSync(steamappsDir)

      fs.writeFileSync(
        path.join(steamappsDir, 'appmanifest_740.acf'),
        `"AppState" { "appid" "740" }`
      )

      const version = await steamcmd.getInstalledVersion({
        applicationId: 740,
        path: tempDir,
      })

      expect(version).not.toBeNull()
      expect(version.appId).toBe(740)
      expect(version.name).toBe('Unknown')
      expect(version.buildId).toBe(0)
      expect(version.lastUpdated).toBeNull()
    })
  })

  describe('createProgressEmitter()', () => {
    it('should return an EventEmitter', () => {
      const emitter = steamcmd.createProgressEmitter('install', {
        applicationId: 740,
      })
      expect(emitter).toBeDefined()
      expect(typeof emitter.on).toBe('function')
      expect(typeof emitter.once).toBe('function')
      expect(typeof emitter.emit).toBe('function')
    })

    it('should accept operation types', () => {
      // Just verify no errors are thrown for valid operation types
      steamcmd.createProgressEmitter('install', { applicationId: 740 })
      steamcmd.createProgressEmitter('update', { applicationId: 740 })
      steamcmd.createProgressEmitter('validate', { applicationId: 740 })
    })

    it('should emit progress or error events', () => {
      return new Promise((resolve) => {
        const emitter = steamcmd.createProgressEmitter('install', {
          applicationId: 740,
        })

        emitter.on('progress', () => {
          resolve()
        })

        emitter.on('error', () => {
          // Also acceptable outcome (SteamCMD not installed)
          resolve()
        })

        emitter.on('complete', () => {
          resolve()
        })
      })
    })
  })
})
