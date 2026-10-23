const { spawn } = require("node:child_process");
const path = require("node:path");
const args = process.argv.slice(2);
const env = { ...process.env };
if (process.platform === "win32") {
  const shim = path
    .join(__dirname, "windows-fs-compat.cjs")
    .replaceAll("\\", "/");
  env.NODE_OPTIONS = `${env.NODE_OPTIONS || ""} --require="${shim}"`;
}
const child = spawn(
  process.execPath,
  [require.resolve("next/dist/bin/next"), ...args],
  { stdio: "inherit", env },
);
child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
