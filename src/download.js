const https = require("https");
const os = require("os");
const fs = require("fs");
const tar = require("tar");
const unzip = require("unzipper");

const env = require("./env");

const urls = {
  darwin:
    "https://steamcdn-a.akamaihd.net/client/installer/steamcmd_osx.tar.gz",
  linux:
    "https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz",
  win32: "https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip",
};

function download(callback) {
  const platform = os.platform();
  const url = urls[platform];
  const destDir = env.directory();

  if (!url) {
    callback(new Error("Platform unsupported"));
    return;
  }

  // Ensure destination directory exists
  fs.mkdirSync(destDir, { recursive: true });

  if (platform === "darwin" || platform === "linux") {
    https
      .get(url, function (res) {
        if (res.statusCode !== 200) {
          callback(
            new Error("Failed to download SteamCMD: HTTP " + res.statusCode),
          );
          return;
        }
        res
          .pipe(tar.x({ cwd: destDir }))
          .on("error", function (err) {
            callback(err);
          })
          .on("finish", function () {
            callback(null);
          });
      })
      .on("error", function (err) {
        callback(err);
      });
  } else if (platform === "win32") {
    https
      .get(url, function (res) {
        if (res.statusCode !== 200) {
          callback(
            new Error("Failed to download SteamCMD: HTTP " + res.statusCode),
          );
          return;
        }
        res
          .pipe(unzip.Extract({ path: destDir }))
          .on("error", function (err) {
            callback(err);
          })
          .on("close", function () {
            callback(null);
          });
      })
      .on("error", function (err) {
        callback(err);
      });
  }
}

module.exports = download;
