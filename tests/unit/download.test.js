import { describe, it, expect } from "vitest";

// Import the module exports we can test without mocking
import download, {
  DownloadError,
  DOWNLOAD_URLS,
  downloadWithProgress,
} from "../../src/download.js";
import { EventEmitter } from "events";

describe("download.js", () => {
  describe("DownloadError", () => {
    it("should create an error with message and code", () => {
      const err = new DownloadError("test message", "TEST_CODE");
      expect(err.message).toBe("test message");
      expect(err.code).toBe("TEST_CODE");
      expect(err.name).toBe("DownloadError");
    });

    it("should be instanceof Error", () => {
      const err = new DownloadError("test", "CODE");
      expect(err).toBeInstanceOf(Error);
    });

    it("should be throwable and catchable", () => {
      expect(() => {
        throw new DownloadError("test error", "TEST");
      }).toThrow("test error");
    });
  });

  describe("DOWNLOAD_URLS", () => {
    it("should have URL for darwin", () => {
      expect(DOWNLOAD_URLS.darwin).toBeDefined();
      expect(DOWNLOAD_URLS.darwin).toContain("https://");
      expect(DOWNLOAD_URLS.darwin).toContain("steamcmd");
      expect(DOWNLOAD_URLS.darwin).toContain("osx");
    });

    it("should have URL for linux", () => {
      expect(DOWNLOAD_URLS.linux).toBeDefined();
      expect(DOWNLOAD_URLS.linux).toContain("https://");
      expect(DOWNLOAD_URLS.linux).toContain("steamcmd");
      expect(DOWNLOAD_URLS.linux).toContain("linux");
    });

    it("should have URL for win32", () => {
      expect(DOWNLOAD_URLS.win32).toBeDefined();
      expect(DOWNLOAD_URLS.win32).toContain("https://");
      expect(DOWNLOAD_URLS.win32).toContain("steamcmd");
      expect(DOWNLOAD_URLS.win32).toContain(".zip");
    });

    it("should use HTTPS for all URLs (security)", () => {
      Object.values(DOWNLOAD_URLS).forEach((url) => {
        expect(url).toMatch(/^https:\/\//);
      });
    });

    it("should point to Steam CDN", () => {
      Object.values(DOWNLOAD_URLS).forEach((url) => {
        expect(url).toContain("steamcdn-a.akamaihd.net");
      });
    });
  });

  describe("download()", () => {
    it("should be a function", () => {
      expect(typeof download).toBe("function");
    });

    it("should return a Promise when no callback provided", () => {
      // Start the download but cancel immediately by not awaiting
      const result = download();
      expect(result).toBeInstanceOf(Promise);
      // We don't await - just testing that it returns a promise
    });

    it("should accept options object", () => {
      const result = download({ onProgress: () => {} });
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe("downloadWithProgress()", () => {
    it("should be a function", () => {
      expect(typeof downloadWithProgress).toBe("function");
    });

    it("should return an EventEmitter", () => {
      const emitter = downloadWithProgress();
      expect(emitter).toBeInstanceOf(EventEmitter);
    });

    it("should accept options object", () => {
      const emitter = downloadWithProgress({});
      expect(emitter).toBeInstanceOf(EventEmitter);
    });
  });
});
