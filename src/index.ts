#!/usr/bin/env node

import yargs from "yargs";
import * as beautify from "js-beautify";
import * as path from "path";
import * as fs from "fs";
import * as mkdirp from "mkdirp";

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
    tabsize: {
      type: "number",
      describe: "Indentation for HTML formatting. Defaults to 2.",
      default: 2,
    },
    ignoreerrors: {
      type: "boolean",
      describe: "Ignore compilation errors and move to the next page.",
      default: false,
    },
  }).argv;

const sourceDir = path.resolve(argv.s);
const outputDir = path.resolve(argv.o);

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
};

for (const file of files) {
  try {
    const page = require(file).default;
    const pageResult: PageResult[] | PageResult = page();

    if (Array.isArray(pageResult)) {
      for (const result of pageResult) {
        const newPath = path.resolve(
          outputDir,
          result.path.replace(/\.js$/, ".html")
        );
        writeFile(newPath, result.html);
      }
    } else {
      const relativePath = file.replace(sourceDir + "/", "");
      const newPath = path.resolve(
        outputDir,
        relativePath.replace(/\.js$/, ".html")
      );
      writeFile(newPath, pageResult.html);
    }
  } catch (ex) {
    console.log(ex.toString());
    console.log(`Skipped ${file}.`);
  }
}

function writeFile(fullPath: string, contents: string) {
  const outputDir = path.dirname(fullPath);
  const filename = path.basename(fullPath);
  const filenameWithoutExt = filename.replace(".html", "");

  const { finalDir, finalFilename } =
    argv.noext && filename !== "index.html"
      ? {
          finalDir: path.resolve(outputDir, filenameWithoutExt),
          finalFilename: "index.html",
        }
      : { finalDir: outputDir, finalFilename: filename };

  if (!fs.existsSync(finalDir)) {
    mkdirp.sync(finalDir);
  }
  const formatted = beautify.html(contents, { indent_size: argv.tabsize });
  fs.writeFileSync(path.resolve(finalDir, finalFilename), formatted);
}
