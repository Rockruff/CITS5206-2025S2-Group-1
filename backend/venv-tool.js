#!/usr/bin/env node
const shell = require("shelljs");
const path = require("path");
const { spawnSync } = require("child_process");

const backendDir = path.resolve(__dirname);
const venvDir = path.join(backendDir, ".venv");
const isWindows = process.platform === "win32";

// Determine Python command based on OS
const pythonCmd = isWindows ? "python" : "python3";

// Get path to venv executable/tool
const venvTool = (name) => {
  return isWindows ? path.join(venvDir, "Scripts", `${name}.exe`) : path.join(venvDir, "bin", name);
};

// Run a command with arguments, exit on failure
const run = (cmd, args) => {
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.error) process.exit(1);
  if (result.status !== 0) process.exit(result.status);
};

const mode = process.argv[2];
shell.cd(backendDir);

if (mode === "--init") {
  // Initialize virtual environment and install dependencies
  if (!shell.test("-d", venvDir)) {
    run(pythonCmd, ["-m", "venv", ".venv"]);
  }
  const venvPython = venvTool("python");
  run(venvPython, ["-m", "pip", "install", "black"]);
  run(venvPython, ["-m", "pip", "install", "pip-tools"]);
  run(venvPython, ["-m", "piptools", "compile", "requirements.in"]);
  run(venvPython, ["-m", "pip", "install", "-r", "requirements.txt"]);
} else if (mode === "--python") {
  const venvPython = venvTool("python");
  run(venvPython, process.argv.slice(3));
}
