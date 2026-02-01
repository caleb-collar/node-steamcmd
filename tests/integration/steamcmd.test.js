import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";

// Import the main module
import steamcmd from "../../dist/steamcmd.js";

describe("steamcmd.js (integration)", () => {
  describe("module exports", () => {
    it("should export install function", () => {
      expect(typeof steamcmd.install).toBe("function");
    });

    it("should export isInstalled function", () => {
      expect(typeof steamcmd.isInstalled).toBe("function");
    });

    it("should export ensureInstalled function", () => {
      expect(typeof steamcmd.ensureInstalled).toBe("function");
    });

    it("should export getInfo function", () => {
      expect(typeof steamcmd.getInfo).toBe("function");
    });

    it("should export SteamCmdError class", () => {
      expect(steamcmd.SteamCmdError).toBeDefined();
    });

    it("should export DownloadError class", () => {
      expect(steamcmd.DownloadError).toBeDefined();
    });

    it("should export InstallError class", () => {
      expect(steamcmd.InstallError).toBeDefined();
    });

    it("should export downloadWithProgress function", () => {
      expect(typeof steamcmd.downloadWithProgress).toBe("function");
    });

    it("should export installWithProgress function", () => {
      expect(typeof steamcmd.installWithProgress).toBe("function");
    });
  });

  describe("SteamCmdError", () => {
    it("should create an error with message and code", () => {
      const err = new steamcmd.SteamCmdError("test message", "TEST_CODE");
      expect(err.message).toBe("test message");
      expect(err.code).toBe("TEST_CODE");
      expect(err.name).toBe("SteamCmdError");
    });

    it("should be instanceof Error", () => {
      const err = new steamcmd.SteamCmdError("test", "CODE");
      expect(err).toBeInstanceOf(Error);
    });

    it("should include cause when provided", () => {
      const cause = new Error("original error");
      const err = new steamcmd.SteamCmdError("wrapped", "CODE", cause);
      expect(err.cause).toBe(cause);
    });
  });

  describe("getInfo()", () => {
    it("should return platform info object", () => {
      const info = steamcmd.getInfo();
      expect(info).toHaveProperty("directory");
      expect(info).toHaveProperty("executable");
      expect(info).toHaveProperty("platform");
      expect(info).toHaveProperty("isSupported");
    });

    it("should return string for directory", () => {
      const info = steamcmd.getInfo();
      expect(typeof info.directory).toBe("string");
    });

    it("should return string for platform", () => {
      const info = steamcmd.getInfo();
      expect(typeof info.platform).toBe("string");
    });

    it("should return boolean for isSupported", () => {
      const info = steamcmd.getInfo();
      expect(typeof info.isSupported).toBe("boolean");
    });

    it("should return true for isSupported on standard platforms", () => {
      const info = steamcmd.getInfo();
      // Assuming we run tests on a standard platform
      expect(info.isSupported).toBe(true);
    });
  });

  describe("isInstalled()", () => {
    it("should return a Promise", () => {
      const result = steamcmd.isInstalled();
      expect(result).toBeInstanceOf(Promise);
    });

    it("should resolve to a boolean", async () => {
      const result = await steamcmd.isInstalled();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("install()", () => {
    it("should return a Promise when no callback provided", () => {
      // We expect this to reject because we're not providing valid options
      // but it should still return a promise (don't await to avoid timeout)
      const result = steamcmd.install({});
      expect(result).toBeInstanceOf(Promise);
      // Catch the rejection to prevent unhandled promise rejection warning
      result.catch(() => {});
    });

    it("should reject for null options", async () => {
      await expect(steamcmd.install(null)).rejects.toThrow();
    });

    it("should reject for non-object options", async () => {
      await expect(steamcmd.install("string")).rejects.toThrow();
    });
  });

  describe("installWithProgress()", () => {
    it.skip("should return an EventEmitter (spawns real process)", () => {
      // Skip this test as it spawns real processes that fail in CI
      // The function returns an EventEmitter immediately but starts
      // background process via process.nextTick
      const emitter = steamcmd.installWithProgress({});
      expect(emitter).toBeInstanceOf(EventEmitter);
      emitter.on("error", () => {});
    });
  });
});
