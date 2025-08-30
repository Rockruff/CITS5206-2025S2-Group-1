#!/usr/bin/env node
// backend/venv-tool.js
/* A tiny helper invoked by Husky/lint-staged to prep backend deps. */

const { execSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");

const backendDir = __dirname;
const venvDir = path.join(backendDir, ".venv");
const py =
  process.platform === "win32" ? path.join(venvDir, "Scripts", "python.exe") : path.join(venvDir, "bin", "python");

function sh(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

try {
  // 1) Ensure venv
  if (!existsSync(venvDir)) {
    sh(`python3 -m venv "${venvDir}"`, { cwd: backendDir });
  }

  // 2) Ensure pip-tools
  sh(`"${py}" -m pip install --upgrade pip`, { cwd: backendDir });
  sh(`"${py}" -m pip install pip-tools`, { cwd: backendDir });

  // 3) Compile requirements.txt if missing but requirements.in exists
  const reqIn = path.join(backendDir, "requirements.in");
  const reqTxt = path.join(backendDir, "requirements.txt");
  if (!existsSync(reqTxt) && existsSync(reqIn)) {
    sh(`"${py}" -m piptools compile "${reqIn}" -o "${reqTxt}"`, {
      cwd: backendDir,
    });
  }

  // 4) Install deps
  if (existsSync(reqTxt)) {
    sh(`"${py}" -m pip install -r "${reqTxt}"`, { cwd: backendDir });
  } else if (existsSync(reqIn)) {
    // Fallback: install from .in (not pinned)
    sh(`"${py}" -m pip install -r "${reqIn}"`, { cwd: backendDir });
  } else {
    console.warn("No requirements.in or requirements.txt found. Skipping.");
  }

  console.log("venv-tool.js: backend environment ready ✅");
  process.exit(0);
} catch (e) {
  console.error("venv-tool.js failed:", e.message);
  process.exit(1);
}
