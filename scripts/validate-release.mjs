import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../module.json", import.meta.url), "utf8"));
const repository = "https://github.com/black-appel/foundry-mod-summed-up-damage-rolls";
const errors = [];

if (manifest.id !== "summed-up-damage-rolls") errors.push("Unexpected module id.");
if (manifest.authors?.[0]?.name !== "black-appel") errors.push("Publisher must be black-appel.");
if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) errors.push("Version must use SemVer.");
if (manifest.url !== repository) errors.push("Repository URL is incorrect.");
if (manifest.manifest !== `${repository}/releases/latest/download/module.json`) errors.push("Manifest URL is incorrect.");
if (manifest.download !== `${repository}/releases/download/v${manifest.version}/summed-up-damage-rolls.zip`) {
  errors.push("Download URL does not match the module version.");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Release metadata for v${manifest.version} is valid.`);
