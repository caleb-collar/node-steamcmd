import { describe, it, expect } from "vitest";

// Import the module under test - these are pure functions that don't need mocking
import {
  createArguments,
  validateOptions,
  parseProgress,
  InstallError,
} from "../../src/install.js";

describe("install.js", () => {
  describe("InstallError", () => {
    it("should create an error with message and code", () => {
      const err = new InstallError("test message", "TEST_CODE");
      expect(err.message).toBe("test message");
      expect(err.code).toBe("TEST_CODE");
      expect(err.name).toBe("InstallError");
    });

    it("should include exitCode when provided", () => {
      const err = new InstallError("test message", "TEST_CODE", 42);
      expect(err.exitCode).toBe(42);
    });

    it("should be instanceof Error", () => {
      const err = new InstallError("test", "CODE");
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe("validateOptions()", () => {
    it("should throw for null options", () => {
      expect(() => validateOptions(null)).toThrow(InstallError);
      expect(() => validateOptions(null)).toThrow("Options must be an object");
    });

    it("should throw for non-object options", () => {
      expect(() => validateOptions("string")).toThrow(InstallError);
      expect(() => validateOptions(123)).toThrow(InstallError);
    });

    it("should accept empty options object", () => {
      expect(() => validateOptions({})).not.toThrow();
    });

    describe("applicationId validation", () => {
      it("should accept valid applicationId", () => {
        expect(() => validateOptions({ applicationId: 740 })).not.toThrow();
        expect(() => validateOptions({ applicationId: "740" })).not.toThrow();
      });

      it("should throw for negative applicationId", () => {
        expect(() => validateOptions({ applicationId: -1 })).toThrow(
          "applicationId must be a positive integer",
        );
      });

      it("should throw for zero applicationId", () => {
        expect(() => validateOptions({ applicationId: 0 })).toThrow(
          "applicationId must be a positive integer",
        );
      });

      it("should throw for non-numeric applicationId", () => {
        expect(() => validateOptions({ applicationId: "abc" })).toThrow(
          "applicationId must be a positive integer",
        );
      });

      it("should throw for floating point applicationId", () => {
        expect(() => validateOptions({ applicationId: 740.5 })).toThrow(
          "applicationId must be a positive integer",
        );
      });
    });

    describe("workshopId validation", () => {
      it("should accept valid workshopId with applicationId", () => {
        expect(() =>
          validateOptions({ applicationId: 740, workshopId: 12345 }),
        ).not.toThrow();
      });

      it("should throw for workshopId without applicationId", () => {
        expect(() => validateOptions({ workshopId: 12345 })).toThrow(
          "workshopId requires applicationId to be specified",
        );
      });

      it("should throw for negative workshopId", () => {
        expect(() =>
          validateOptions({ applicationId: 740, workshopId: -1 }),
        ).toThrow("workshopId must be a positive integer");
      });
    });

    describe("platform validation", () => {
      it("should accept valid platforms", () => {
        expect(() => validateOptions({ platform: "windows" })).not.toThrow();
        expect(() => validateOptions({ platform: "macos" })).not.toThrow();
        expect(() => validateOptions({ platform: "linux" })).not.toThrow();
      });

      it("should throw for invalid platform", () => {
        expect(() => validateOptions({ platform: "freebsd" })).toThrow(
          "platform must be one of: windows, macos, linux",
        );
      });
    });

    describe("authentication validation", () => {
      it("should accept username and password", () => {
        expect(() =>
          validateOptions({ username: "user", password: "pass" }),
        ).not.toThrow();
      });

      it("should throw for password without username", () => {
        expect(() => validateOptions({ password: "pass" })).toThrow(
          "password requires username to be specified",
        );
      });

      it("should throw for steamGuardCode without username", () => {
        expect(() => validateOptions({ steamGuardCode: "ABC12" })).toThrow(
          "steamGuardCode requires username to be specified",
        );
      });

      it("should accept steamGuardCode with username", () => {
        expect(() =>
          validateOptions({ username: "user", steamGuardCode: "ABC12" }),
        ).not.toThrow();
      });
    });
  });

  describe("createArguments()", () => {
    it("should return an array", () => {
      const args = createArguments({});
      expect(Array.isArray(args)).toBe(true);
    });

    it("should include no-prompt flag", () => {
      const args = createArguments({});
      expect(args).toContain("+@NoPromptForPassword 1");
    });

    it("should include shutdown on fail flag", () => {
      const args = createArguments({});
      expect(args).toContain("+@ShutdownOnFailedCommand 1");
    });

    it("should include quit command", () => {
      const args = createArguments({});
      expect(args).toContain("+quit");
    });

    describe("anonymous login", () => {
      it("should login anonymously without credentials", () => {
        const args = createArguments({});
        expect(args).toContain("+login anonymous");
      });
    });

    describe("authenticated login", () => {
      it("should login with username only", () => {
        const args = createArguments({ username: "testuser" });
        expect(args).toContain("+login testuser");
        expect(args).not.toContain("+login anonymous");
      });

      it("should login with username and password", () => {
        const args = createArguments({
          username: "testuser",
          password: "testpass",
        });
        expect(args).toContain("+login testuser testpass");
      });
    });

    describe("steam guard", () => {
      it("should include steam guard code when provided", () => {
        const args = createArguments({
          username: "testuser",
          steamGuardCode: "ABC12",
        });
        expect(args).toContain("+set_steam_guard_code ABC12");
      });
    });

    describe("platform forcing", () => {
      it("should force platform when specified", () => {
        const args = createArguments({ platform: "windows" });
        expect(args).toContain("+@sSteamCmdForcePlatformType windows");
      });
    });

    describe("installation path", () => {
      it("should set install directory when path provided", () => {
        const args = createArguments({ path: "/install/path" });
        expect(args).toContain('+force_install_dir "/install/path"');
      });
    });

    describe("app installation", () => {
      it("should include app_update for applicationId", () => {
        const args = createArguments({ applicationId: 740 });
        expect(args).toContain("+app_update 740 validate");
      });

      it("should not include app_update when workshopId is present", () => {
        const args = createArguments({
          applicationId: 740,
          workshopId: 12345,
        });
        expect(args).not.toContain("+app_update 740 validate");
      });
    });

    describe("workshop installation", () => {
      it("should include workshop_download_item for workshopId", () => {
        const args = createArguments({
          applicationId: 740,
          workshopId: 12345,
        });
        expect(args).toContain("+workshop_download_item 740 12345");
      });
    });

    describe("argument ordering", () => {
      it("should have quit as the last argument", () => {
        const args = createArguments({
          applicationId: 740,
          path: "/install",
          platform: "linux",
        });
        expect(args[args.length - 1]).toBe("+quit");
      });

      it("should have platform as first argument when specified", () => {
        const args = createArguments({ platform: "windows" });
        expect(args[0]).toBe("+@sSteamCmdForcePlatformType windows");
      });
    });
  });

  describe("parseProgress()", () => {
    it("should return null for non-progress output", () => {
      expect(parseProgress("Loading Steam API...")).toBeNull();
      expect(parseProgress("Connecting to Steam servers...")).toBeNull();
    });

    describe("update state parsing", () => {
      it("should parse downloading progress", () => {
        const output =
          "Update state (0x61) downloading, progress: 45.23 (1234567890 / 2732853760)";
        const progress = parseProgress(output);
        expect(progress).toEqual({
          phase: "downloading",
          percent: 45,
          bytesDownloaded: 1234567890,
          totalBytes: 2732853760,
        });
      });

      it("should parse verifying progress", () => {
        const output =
          "Update state (0x5) verifying, progress: 12.50 (100000 / 800000)";
        const progress = parseProgress(output);
        expect(progress).toEqual({
          phase: "verifying",
          percent: 13, // Math.round(12.50)
          bytesDownloaded: 100000,
          totalBytes: 800000,
        });
      });

      it("should parse preallocating progress", () => {
        const output =
          "Update state (0x11) preallocating, progress: 0.00 (0 / 1000000)";
        const progress = parseProgress(output);
        expect(progress).toEqual({
          phase: "preallocating",
          percent: 0,
          bytesDownloaded: 0,
          totalBytes: 1000000,
        });
      });
    });

    describe("validation parsing", () => {
      it("should parse validation percentage", () => {
        const output = "Validating: 45%";
        const progress = parseProgress(output);
        expect(progress).toEqual({
          phase: "validating",
          percent: 45,
          bytesDownloaded: 0,
          totalBytes: 0,
        });
      });

      it("should parse validation with different format", () => {
        const output = "Validating Steam cache files... 100%";
        const progress = parseProgress(output);
        expect(progress).toEqual({
          phase: "validating",
          percent: 100,
          bytesDownloaded: 0,
          totalBytes: 0,
        });
      });
    });

    describe("progress bar parsing", () => {
      it("should parse progress bar output", () => {
        const output = "[####    ] 50%";
        const progress = parseProgress(output);
        expect(progress).toEqual({
          phase: "downloading",
          percent: 50,
          bytesDownloaded: 0,
          totalBytes: 0,
        });
      });
    });
  });
});
