import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Import the actual module - testing real behavior on current platform
import {
  directory,
  executable,
  isPlatformSupported,
  platform,
  SUPPORTED_PLATFORMS,
} from "../../dist/env.js";

describe("env.js", () => {
  describe("SUPPORTED_PLATFORMS", () => {
    it("should include linux", () => {
      expect(SUPPORTED_PLATFORMS).toContain("linux");
    });

    it("should include darwin", () => {
      expect(SUPPORTED_PLATFORMS).toContain("darwin");
    });

    it("should include win32", () => {
      expect(SUPPORTED_PLATFORMS).toContain("win32");
    });

    it("should have exactly 3 supported platforms", () => {
      expect(SUPPORTED_PLATFORMS).toHaveLength(3);
    });
  });

  describe("platform()", () => {
    it("should return a string", () => {
      expect(typeof platform()).toBe("string");
    });

    it("should match os.platform()", () => {
      expect(platform()).toBe(os.platform());
    });
  });

  describe("isPlatformSupported()", () => {
    it("should return a boolean", () => {
      expect(typeof isPlatformSupported()).toBe("boolean");
    });

    it("should return true on current platform (assuming standard OS)", () => {
      // This test assumes we're running on a supported platform
      const currentPlatform = os.platform();
      if (SUPPORTED_PLATFORMS.includes(currentPlatform)) {
        expect(isPlatformSupported()).toBe(true);
      }
    });
  });

  describe("directory()", () => {
    it("should return a string path", () => {
      expect(typeof directory()).toBe("string");
    });

    it("should return an absolute path", () => {
      expect(path.isAbsolute(directory())).toBe(true);
    });
  });

  describe("executable()", () => {
    const currentPlatform = os.platform();

    it("should return a path on supported platforms", () => {
      if (SUPPORTED_PLATFORMS.includes(currentPlatform)) {
        expect(executable()).not.toBeNull();
        expect(typeof executable()).toBe("string");
      }
    });

    it("should return correct executable name for current platform", () => {
      const execPath = executable();
      if (execPath !== null) {
        const execName = path.basename(execPath);
        if (currentPlatform === "win32") {
          expect(execName).toBe("steamcmd.exe");
        } else {
          expect(execName).toBe("steamcmd.sh");
        }
      }
    });

    it("should return a path inside the directory", () => {
      const execPath = executable();
      if (execPath !== null) {
        expect(execPath.startsWith(directory())).toBe(true);
      }
    });
  });
});
