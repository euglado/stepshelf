import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const manifest = JSON.parse(readFileSync("package.json", "utf8"));
const licenses = new Set(["MIT", "Apache-2.0", "MIT OR Apache-2.0", "0BSD"]);
assert.equal(lock.name, manifest.name);
let packages = 0;
for (const [location, entry] of Object.entries(lock.packages)) {
  if (!location) continue;
  assert.ok(
    location.startsWith("node_modules/") && !location.includes(".."),
    "Unexpected dependency path",
  );
  assert.ok(licenses.has(entry.license), `Review dependency license: ${location}`);
  assert.ok(
    entry.resolved?.startsWith("https://registry.npmjs.org/"),
    "Dependency must use the npm registry",
  );
  assert.match(
    entry.integrity ?? "",
    /^sha512-[A-Za-z0-9+/]+=*$/,
    "Dependency requires SHA-512 integrity",
  );
  const installed = join(location, "package.json");
  if (existsSync(installed)) {
    const actual = JSON.parse(readFileSync(installed, "utf8"));
    assert.equal(
      actual.version,
      entry.version,
      `Installed dependency version mismatch: ${location}`,
    );
    assert.ok(licenses.has(actual.license), `Installed license mismatch: ${location}`);
  } else assert.equal(entry.optional, true, `Missing required dependency: ${location}`);
  packages++;
}
for (const field of ["dependencies", "devDependencies"]) {
  for (const [name, version] of Object.entries(manifest[field] ?? {})) {
    assert.match(version, /^\d+\.\d+\.\d+$/, "Direct dependencies must have exact versions");
    assert.equal(lock.packages[`node_modules/${name}`].version, version);
  }
}
const files = [];
function walk(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    if (
      [".git", "node_modules", "dist", "coverage"].includes(item.name) ||
      (item.name.startsWith(".env") && item.name !== ".env.example")
    )
      continue;
    const path = join(dir, item.name);
    if (item.isDirectory()) walk(path);
    else if (item.isFile()) files.push(path);
    else throw Error("Unexpected link in source");
  }
}
walk(".");
const patterns = [
  new RegExp("gh" + "[pousr]_[A-Za-z0-9]{30,}"),
  new RegExp("github" + "_pat_[A-Za-z0-9_]{30,}"),
  new RegExp("mfa" + "\\.[A-Za-z0-9_-]{60,}"),
  /[A-Za-z0-9_-]{23,30}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}/,
  new RegExp("-----BEGIN " + "(?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
];
for (const file of files) {
  const content = readFileSync(file, "utf8");
  assert.ok(
    !patterns.some((pattern) => pattern.test(content)),
    `Possible credential in ${file}; values are never printed`,
  );
}
if (existsSync(".git")) {
  const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
  assert.ok(
    !tracked.some((file) => /(^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith(".env.example")),
    "Environment files must never be tracked",
  );
}
console.log(
  `${packages} dependency license/source/integrity entries; ${files.length} source credential-pattern checks passed.`,
);
console.log("Pattern scans cannot prove the absence of secrets; review changes before pushing.");
