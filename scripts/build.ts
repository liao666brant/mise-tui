import { cp, rm } from "node:fs/promises";
import { $ } from "bun";

const buildSourceDir = ".build-src";
const buildEntry = `${buildSourceDir}/index.ts`;
const outputFile = "./dist/index.cjs";

await rm(buildSourceDir, { force: true, recursive: true });
await cp("./src", buildSourceDir, { recursive: true });

const entrySource = await Bun.file(buildEntry).text();
await Bun.write(buildEntry, entrySource.replace(/^#!.*\n/, "#!/usr/bin/env node\n"));

await $`bun build ${buildEntry} --target node --format cjs --outfile ${outputFile}`;

const outputSource = await Bun.file(outputFile).text();
await Bun.write(outputFile, outputSource.replace(/^#!.*\n/, "#!/usr/bin/env bun\n"));

await rm(buildSourceDir, { force: true, recursive: true });
