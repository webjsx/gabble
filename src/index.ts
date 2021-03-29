#!/usr/bin/env node

import yargs from "yargs";
import * as fs from "fs";
import * as path from "path";
import { join } from "path";
import * as beautify from "js-beautify";

function error(message: string) {
  throw new Error(message);
}

const argv = yargs(process.argv.slice(2))
  .scriptName("gabble")
  .usage("$0 -s <source_dir> -o <output_dir> [options]")
  .options({
    s: {
      type: "string",
      describe: "The source directory. Should contain the pages.",
      demandOption: true,
    },
    o: {
      type: "string",
      describe: "The output directory.",
      demandOption: true,
    },
    noext: {
      type: "boolean",
      describe: "Do not use html extension for files.",
      default: false,
    },
  }).argv;

const sourceDir = path.resolve(argv.s);
const outputDir = path.resolve(argv.s);

function getFiles(dir: string) {
  const files: string[] = [];

  const entries = fs.readdirSync(dir, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      files.push(...getFiles(path.join(dir, entry.name)));
    } else {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

const files = getFiles(sourceDir).filter((x) => x.endsWith(".js"));

type PageResult = {
  path: string;
  html: string;
}[];

for (const file of files) {
  const page = require(file).default;
  const pageResult: string | PageResult = page();

  if (Array.isArray(pageResult)) {
    for (const result of pageResult) {
      const newPath = path.resolve(outputDir, result.path);
      writeFile(newPath, result.html);
    }
  } else {
    const relativePath = file.replace(sourceDir + "/", "");
    const newPath = path.resolve(outputDir, relativePath);
    writeFile(newPath, pageResult);
  }
}

function writeFile(fullPath: string, contents: string) {
  const formatted = beautify.html(contents);
  fs.writeFileSync(fullPath, formatted);
}
