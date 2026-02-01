import { describe, it, expect } from "vitest";

// Import the module under test - these are pure functions that don't need mocking
import install, {
  createArguments,
  validateOptions,
  parseProgress,
  InstallError,
  installWithProgress,
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

    it("should have correct error properties", () => {
      const err = new InstallError("spawn failed", "SPAWN_ERROR", 1);
      expect(err.name).toBe("InstallError");
      expect(err.code).toBe("SPAWN_ERROR");
      expect(err.message).toBe("spawn failed");
      expect(err.exitCode).toBe(1);
      expect(err.stack).toBeDefined();
    });

    it("should work with try/catch", () => {
      let caught = null;
      try {
        throw new InstallError("test", "CODE", 127);
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(InstallError);
      expect(caught.code).toBe("CODE");
      expect(caught.exitCode).toBe(127);
    });

    it("should allow undefined exitCode", () => {
      const err = new InstallError("test", "CODE");
      expect(err.exitCode).toBeUndefined();
    });
  });

  describe("validateOptions()", () => {
    it("should throw for null options", () => {
      expect(() => validateOptions(null)).toThrow(InstallError);
      expect(() => validateOptions(null)).toThrow("Options must be an object");
    });

    it("should throw for undefined options", () => {
      expect(() => validateOptions(undefined)).toThrow(InstallError);
    });

    it("should throw for non-object options", () => {
      expect(() => validateOptions("string")).toThrow(InstallError);
      expect(() => validateOptions(123)).toThrow(InstallError);
      expect(() => validateOptions(true)).toThrow(InstallError);
    });

    it("should accept empty options object", () => {
      expect(() => validateOptions({})).not.toThrow();
    });

    describe("applicationId validation", () => {
      it("should accept valid applicationId", () => {
        expect(() => validateOptions({ applicationId: 740 })).not.toThrow();
        expect(() => validateOptions({ applicationId: "740" })).not.toThrow();
      });

      it("should accept large applicationId", () => {
        expect(() => validateOptions({ applicationId: 9999999 })).not.toThrow();
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

      it("should throw for NaN applicationId", () => {
        expect(() => validateOptions({ applicationId: NaN })).toThrow(
          "applicationId must be a positive integer",
        );
      });

      it("should throw for Infinity applicationId", () => {
        expect(() => validateOptions({ applicationId: Infinity })).toThrow(
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

      it("should accept string workshopId", () => {
        expect(() =>
          validateOptions({ applicationId: 740, workshopId: "12345" }),
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

      it("should throw for zero workshopId", () => {
        expect(() =>
          validateOptions({ applicationId: 740, workshopId: 0 }),
        ).toThrow("workshopId must be a positive integer");
      });

      it("should throw for non-numeric workshopId", () => {
        expect(() =>
          validateOptions({ applicationId: 740, workshopId: "abc" }),
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

      it("should throw for capitalized platform", () => {
        expect(() => validateOptions({ platform: "Windows" })).toThrow(
          "platform must be one of: windows, macos, linux",
        );
      });

      it("should throw for empty string platform", () => {
        expect(() => validateOptions({ platform: "" })).toThrow(
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

      it("should accept username without password", () => {
        expect(() => validateOptions({ username: "user" })).not.toThrow();
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

      it("should accept all auth options together", () => {
        expect(() =>
          validateOptions({
            username: "user",
            password: "pass",
            steamGuardCode: "ABC12",
          }),
        ).not.toThrow();
      });
    });

    describe("path validation", () => {
      it("should accept valid path", () => {
        expect(() => validateOptions({ path: "/install/dir" })).not.toThrow();
        expect(() =>
          validateOptions({ path: "C:\\Games\\Server" }),
        ).not.toThrow();
      });
    });

    describe("combined options", () => {
      it("should accept full valid options", () => {
        expect(() =>
          validateOptions({
            applicationId: 740,
            path: "/install",
            platform: "linux",
            username: "user",
            password: "pass",
          }),
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

    it("should return at least 4 arguments for empty options", () => {
      const args = createArguments({});
      expect(args.length).toBeGreaterThanOrEqual(4);
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

      it("should have steam guard before login", () => {
        const args = createArguments({
          username: "testuser",
          steamGuardCode: "ABC12",
        });
        const guardIndex = args.indexOf("+set_steam_guard_code ABC12");
        const loginIndex = args.indexOf("+login testuser");
        expect(guardIndex).toBeLessThan(loginIndex);
      });
    });

    describe("platform forcing", () => {
      it("should force platform when specified", () => {
        const args = createArguments({ platform: "windows" });
        expect(args).toContain("+@sSteamCmdForcePlatformType windows");
      });

      it("should not include platform when not specified", () => {
        const args = createArguments({});
        const hasPlatform = args.some((a) =>
          a.includes("@sSteamCmdForcePlatformType"),
        );
        expect(hasPlatform).toBe(false);
      });
    });

    describe("installation path", () => {
      it("should set install directory when path provided", () => {
        const args = createArguments({ path: "/install/path" });
        expect(args).toContain('+force_install_dir "/install/path"');
      });

      it("should handle windows paths", () => {
        const args = createArguments({ path: "C:\\Games\\Server" });
        expect(args).toContain('+force_install_dir "C:\\Games\\Server"');
      });

      it("should have force_install_dir before app_update", () => {
        const args = createArguments({ path: "/install", applicationId: 740 });
        const dirIndex = args.findIndex((a) => a.includes("force_install_dir"));
        const updateIndex = args.indexOf("+app_update 740 validate");
        expect(dirIndex).toBeLessThan(updateIndex);
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

      it("should not include app_update without applicationId", () => {
        const args = createArguments({});
        const hasAppUpdate = args.some((a) => a.includes("app_update"));
        expect(hasAppUpdate).toBe(false);
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

      it("should not include workshop_download_item without workshopId", () => {
        const args = createArguments({ applicationId: 740 });
        const hasWorkshop = args.some((a) =>
          a.includes("workshop_download_item"),
        );
        expect(hasWorkshop).toBe(false);
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

      it("should have login before app_update", () => {
        const args = createArguments({ applicationId: 740 });
        const loginIndex = args.indexOf("+login anonymous");
        const updateIndex = args.indexOf("+app_update 740 validate");
        expect(loginIndex).toBeLessThan(updateIndex);
      });
    });
  });

  describe("parseProgress()", () => {
    it("should return null for non-progress output", () => {
      expect(parseProgress("Loading Steam API...")).toBeNull();
      expect(parseProgress("Connecting to Steam servers...")).toBeNull();
      expect(parseProgress("Logging in user...")).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(parseProgress("")).toBeNull();
    });

    it("should return null for whitespace", () => {
      expect(parseProgress("   ")).toBeNull();
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

      it("should parse 100% progress", () => {
        const output =
          "Update state (0x61) downloading, progress: 100.00 (1000 / 1000)";
        const progress = parseProgress(output);
        expect(progress.percent).toBe(100);
      });

      it("should handle different hex codes", () => {
        const output =
          "Update state (0xAB) committing, progress: 50.00 (500 / 1000)";
        const progress = parseProgress(output);
        expect(progress.phase).toBe("committing");
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

      it("should parse validation at 0%", () => {
        const output = "Validating: 0%";
        const progress = parseProgress(output);
        expect(progress.percent).toBe(0);
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

      it("should return null for empty progress bar", () => {
        // Edge case: 0% may not match the regex
        const output = "[        ] 0%";
        const progress = parseProgress(output);
        expect(progress).toBeNull();
      });

      it("should parse full progress bar", () => {
        const output = "[########] 100%";
        const progress = parseProgress(output);
        expect(progress.percent).toBe(100);
      });
    });
  });

  describe("install()", () => {
    it("should be a function", () => {
      expect(typeof install).toBe("function");
    });
  });

  describe("installWithProgress()", () => {
    it("should be a function", () => {
      expect(typeof installWithProgress).toBe("function");
    });
  });
});
