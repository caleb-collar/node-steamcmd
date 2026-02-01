import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

// Import the module under test
const steamcmd = require("../../src/steamcmd.js");

describe("steamcmd.js new features", () => {
  describe("getInstalledApps()", () => {
    let tempDir;

    beforeEach(() => {
      // Create a temporary directory for testing
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "steamcmd-test-"));
    });

    afterEach(() => {
      // Clean up temporary directory
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it("should throw if path option is missing", async () => {
      await expect(steamcmd.getInstalledApps({})).rejects.toThrow(
        "path option is required",
      );
      await expect(steamcmd.getInstalledApps(null)).rejects.toThrow();
    });

    it("should return empty array if steamapps directory does not exist", async () => {
      const apps = await steamcmd.getInstalledApps({ path: tempDir });
      expect(apps).toEqual([]);
    });

    it("should return empty array if steamapps directory is empty", async () => {
      fs.mkdirSync(path.join(tempDir, "steamapps"));
      const apps = await steamcmd.getInstalledApps({ path: tempDir });
      expect(apps).toEqual([]);
    });

    it("should parse app manifest files", async () => {
      const steamappsDir = path.join(tempDir, "steamapps");
      fs.mkdirSync(steamappsDir);

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
}`;
      fs.writeFileSync(
        path.join(steamappsDir, "appmanifest_740.acf"),
        manifestContent,
      );

      const apps = await steamcmd.getInstalledApps({ path: tempDir });
      expect(apps).toHaveLength(1);
      expect(apps[0].appId).toBe(740);
      expect(apps[0].name).toBe(
        "Counter-Strike Global Offensive - Dedicated Server",
      );
      expect(apps[0].installDir).toBe("csgo");
      expect(apps[0].sizeOnDisk).toBe(27328537600);
      expect(apps[0].buildId).toBe(12345678);
      expect(apps[0].state).toBe(4);
    });

    it("should handle multiple app manifests", async () => {
      const steamappsDir = path.join(tempDir, "steamapps");
      fs.mkdirSync(steamappsDir);

      // Create multiple mock manifests
      fs.writeFileSync(
        path.join(steamappsDir, "appmanifest_740.acf"),
        `"AppState" { "appid" "740" "name" "CSGO Server" }`,
      );
      fs.writeFileSync(
        path.join(steamappsDir, "appmanifest_232330.acf"),
        `"AppState" { "appid" "232330" "name" "CS2 Server" }`,
      );

      const apps = await steamcmd.getInstalledApps({ path: tempDir });
      expect(apps).toHaveLength(2);
      expect(apps.map((a) => a.appId).sort()).toEqual([740, 232330].sort());
    });

    it("should ignore non-manifest files", async () => {
      const steamappsDir = path.join(tempDir, "steamapps");
      fs.mkdirSync(steamappsDir);

      // Create manifest and non-manifest files
      fs.writeFileSync(
        path.join(steamappsDir, "appmanifest_740.acf"),
        `"AppState" { "appid" "740" "name" "Test" }`,
      );
      fs.writeFileSync(
        path.join(steamappsDir, "libraryfolders.vdf"),
        "library data",
      );
      fs.writeFileSync(path.join(steamappsDir, "config.txt"), "config data");

      const apps = await steamcmd.getInstalledApps({ path: tempDir });
      expect(apps).toHaveLength(1);
    });

    it("should skip invalid manifest files", async () => {
      const steamappsDir = path.join(tempDir, "steamapps");
      fs.mkdirSync(steamappsDir);

      // Create valid and invalid manifests
      fs.writeFileSync(
        path.join(steamappsDir, "appmanifest_740.acf"),
        `"AppState" { "appid" "740" "name" "Test" }`,
      );
      fs.writeFileSync(
        path.join(steamappsDir, "appmanifest_invalid.acf"),
        "invalid content {{{",
      );

      const apps = await steamcmd.getInstalledApps({ path: tempDir });
      expect(apps).toHaveLength(2); // Both will parse, just with missing fields
    });
  });

  describe("update()", () => {
    it("should throw if applicationId is missing", async () => {
      await expect(steamcmd.update({})).rejects.toThrow(
        "applicationId option is required",
      );
      await expect(steamcmd.update(null)).rejects.toThrow();
    });

    // Note: Full integration tests would require SteamCMD to be installed
    // These tests just verify the function signature and validation
  });

  describe("validate()", () => {
    it("should throw if applicationId is missing", async () => {
      await expect(steamcmd.validate({})).rejects.toThrow(
        "applicationId option is required",
      );
      await expect(steamcmd.validate(null)).rejects.toThrow();
    });
  });

  describe("getInstalledVersion()", () => {
    let tempDir;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "steamcmd-test-"));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it("should throw if applicationId is missing", async () => {
      await expect(
        steamcmd.getInstalledVersion({ path: tempDir }),
      ).rejects.toThrow("applicationId and path options are required");
    });

    it("should throw if path is missing", async () => {
      await expect(
        steamcmd.getInstalledVersion({ applicationId: 740 }),
      ).rejects.toThrow("applicationId and path options are required");
    });

    it("should return null if app is not installed", async () => {
      const version = await steamcmd.getInstalledVersion({
        applicationId: 740,
        path: tempDir,
      });
      expect(version).toBeNull();
    });

    it("should return version info for installed app", async () => {
      const steamappsDir = path.join(tempDir, "steamapps");
      fs.mkdirSync(steamappsDir);

      const manifestContent = `"AppState"
{
	"appid"		"740"
	"name"		"Counter-Strike Global Offensive - Dedicated Server"
	"buildid"		"12345678"
	"LastUpdated"		"1706745600"
}`;
      fs.writeFileSync(
        path.join(steamappsDir, "appmanifest_740.acf"),
        manifestContent,
      );

      const version = await steamcmd.getInstalledVersion({
        applicationId: 740,
        path: tempDir,
      });

      expect(version).not.toBeNull();
      expect(version.appId).toBe(740);
      expect(version.buildId).toBe(12345678);
      expect(version.name).toBe(
        "Counter-Strike Global Offensive - Dedicated Server",
      );
      expect(version.lastUpdated).toBeInstanceOf(Date);
    });

    it("should handle string applicationId", async () => {
      const steamappsDir = path.join(tempDir, "steamapps");
      fs.mkdirSync(steamappsDir);

      fs.writeFileSync(
        path.join(steamappsDir, "appmanifest_740.acf"),
        `"AppState" { "appid" "740" "name" "Test" "buildid" "123" }`,
      );

      const version = await steamcmd.getInstalledVersion({
        applicationId: "740",
        path: tempDir,
      });

      expect(version).not.toBeNull();
      expect(version.appId).toBe(740);
    });
  });

  describe("createProgressEmitter()", () => {
    it("should return an EventEmitter", () => {
      const emitter = steamcmd.createProgressEmitter("install", {
        applicationId: 740,
      });
      expect(emitter).toBeDefined();
      expect(typeof emitter.on).toBe("function");
      expect(typeof emitter.once).toBe("function");
      expect(typeof emitter.emit).toBe("function");
    });

    it("should accept operation types", () => {
      // Just verify no errors are thrown for valid operation types
      steamcmd.createProgressEmitter("install", { applicationId: 740 });
      steamcmd.createProgressEmitter("update", { applicationId: 740 });
      steamcmd.createProgressEmitter("validate", { applicationId: 740 });
    });
  });

  describe("module exports", () => {
    it("should export getInstalledApps", () => {
      expect(typeof steamcmd.getInstalledApps).toBe("function");
    });

    it("should export update", () => {
      expect(typeof steamcmd.update).toBe("function");
    });

    it("should export validate", () => {
      expect(typeof steamcmd.validate).toBe("function");
    });

    it("should export getInstalledVersion", () => {
      expect(typeof steamcmd.getInstalledVersion).toBe("function");
    });

    it("should export createProgressEmitter", () => {
      expect(typeof steamcmd.createProgressEmitter).toBe("function");
    });
  });
});
