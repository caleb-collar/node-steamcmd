const os = require("os");
const path = require("path");
const envPaths = require("env-paths");

const paths = envPaths("steamcmd", { suffix: "" });

function directory() {
  return paths.data;
}

function executable() {
  const platform = os.platform();

  if (platform === "linux") {
    return path.resolve(directory(), "steamcmd.sh");
  }

  if (platform === "darwin") {
    return path.resolve(directory(), "steamcmd.sh");
  }

  if (platform === "win32") {
    return path.resolve(directory(), "steamcmd.exe");
  }

  return null;
}

module.exports = {
  directory,
  executable,
};
