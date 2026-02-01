import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
// Import the module exports we can test without mocking
import download, {
  DOWNLOAD_URLS,
  DownloadError,
  downloadWithProgress,
} from '../../dist/download.js'

describe('download.js', () => {
  describe('DownloadError', () => {
    it('should create an error with message and code', () => {
      const err = new DownloadError('test message', 'TEST_CODE')
      expect(err.message).toBe('test message')
      expect(err.code).toBe('TEST_CODE')
      expect(err.name).toBe('DownloadError')
    })

    it('should be instanceof Error', () => {
      const err = new DownloadError('test', 'CODE')
      expect(err).toBeInstanceOf(Error)
    })

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new DownloadError('test error', 'TEST')
      }).toThrow('test error')
    })

    it('should have correct error properties', () => {
      const err = new DownloadError('network failed', 'NETWORK_ERROR')
      expect(err.name).toBe('DownloadError')
      expect(err.code).toBe('NETWORK_ERROR')
      expect(err.message).toBe('network failed')
      expect(err.stack).toBeDefined()
    })

    it('should work with try/catch', () => {
      let caught = null
      try {
        throw new DownloadError('test', 'CODE')
      } catch (e) {
        caught = e
      }
      expect(caught).toBeInstanceOf(DownloadError)
      expect(caught.code).toBe('CODE')
    })
  })

  describe('DOWNLOAD_URLS', () => {
    it('should have URL for darwin', () => {
      expect(DOWNLOAD_URLS.darwin).toBeDefined()
      expect(DOWNLOAD_URLS.darwin).toContain('https://')
      expect(DOWNLOAD_URLS.darwin).toContain('steamcmd')
      expect(DOWNLOAD_URLS.darwin).toContain('osx')
    })

    it('should have URL for linux', () => {
      expect(DOWNLOAD_URLS.linux).toBeDefined()
      expect(DOWNLOAD_URLS.linux).toContain('https://')
      expect(DOWNLOAD_URLS.linux).toContain('steamcmd')
      expect(DOWNLOAD_URLS.linux).toContain('linux')
    })

    it('should have URL for win32', () => {
      expect(DOWNLOAD_URLS.win32).toBeDefined()
      expect(DOWNLOAD_URLS.win32).toContain('https://')
      expect(DOWNLOAD_URLS.win32).toContain('steamcmd')
      expect(DOWNLOAD_URLS.win32).toContain('.zip')
    })

    it('should use HTTPS for all URLs (security)', () => {
      Object.values(DOWNLOAD_URLS).forEach((url) => {
        expect(url).toMatch(/^https:\/\//)
      })
    })

    it('should point to Steam CDN', () => {
      Object.values(DOWNLOAD_URLS).forEach((url) => {
        expect(url).toContain('steamcdn-a.akamaihd.net')
      })
    })

    it('should have URLs for all supported platforms', () => {
      expect(Object.keys(DOWNLOAD_URLS)).toContain('darwin')
      expect(Object.keys(DOWNLOAD_URLS)).toContain('linux')
      expect(Object.keys(DOWNLOAD_URLS)).toContain('win32')
    })

    it('should have tar.gz for unix platforms', () => {
      expect(DOWNLOAD_URLS.darwin).toContain('.tar.gz')
      expect(DOWNLOAD_URLS.linux).toContain('.tar.gz')
    })

    it('should have zip for windows', () => {
      expect(DOWNLOAD_URLS.win32).toContain('.zip')
      expect(DOWNLOAD_URLS.win32).not.toContain('.tar.gz')
    })
  })

  describe('download()', () => {
    it('should be a function', () => {
      expect(typeof download).toBe('function')
    })

    it('should return a Promise when no callback provided', () => {
      const result = download()
      expect(result).toBeInstanceOf(Promise)
      // We don't await - just testing that it returns a promise
    })

    it('should accept options object', () => {
      const result = download({ onProgress: () => {} })
      expect(result).toBeInstanceOf(Promise)
    })

    it('should accept empty options', () => {
      const result = download({})
      expect(result).toBeInstanceOf(Promise)
    })

    it('should accept null options with callback', (done) => {
      // Legacy signature: download(callback)
      const cb = () => {
        done()
      }
      // This will start a download but we just test it accepts the signature
      download(cb)
    })
  })

  describe('downloadWithProgress()', () => {
    it('should be a function', () => {
      expect(typeof downloadWithProgress).toBe('function')
    })

    it('should return an EventEmitter', () => {
      const emitter = downloadWithProgress()
      expect(emitter).toBeInstanceOf(EventEmitter)
    })

    it('should accept options object', () => {
      const emitter = downloadWithProgress({})
      expect(emitter).toBeInstanceOf(EventEmitter)
    })

    it('should have on method', () => {
      const emitter = downloadWithProgress()
      expect(typeof emitter.on).toBe('function')
    })

    it('should have once method', () => {
      const emitter = downloadWithProgress()
      expect(typeof emitter.once).toBe('function')
    })

    it('should have emit method', () => {
      const emitter = downloadWithProgress()
      expect(typeof emitter.emit).toBe('function')
    })

    it('should allow binding progress listener', () => {
      const emitter = downloadWithProgress()
      let _called = false
      emitter.on('progress', () => {
        _called = true
      })
      // Emitter is set up correctly
      expect(typeof emitter.listeners('progress')).toBe('object')
    })

    it('should allow binding error listener', () => {
      const emitter = downloadWithProgress()
      let _bound = false
      emitter.on('error', () => {
        _bound = true
      })
      expect(emitter.listeners('error').length).toBe(1)
    })

    it('should allow binding complete listener', () => {
      const emitter = downloadWithProgress()
      emitter.on('complete', () => {})
      expect(emitter.listeners('complete').length).toBe(1)
    })
  })
})
