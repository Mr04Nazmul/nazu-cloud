import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const index = process.argv.indexOf("--port");
const args = [
  process.argv.includes("--strictPort") ? "start" : "dev",
  "apps/web",
  "--hostname",
  "0.0.0.0",
];
if (index >= 0) args.push("--port", process.argv[index + 1]);
const child = spawn(
  process.execPath,
  [require.resolve("next/dist/bin/next"), ...args],
  { stdio: "inherit", env: process.env },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
