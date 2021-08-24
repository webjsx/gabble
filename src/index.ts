#!/usr/bin/env node

import yargs from "yargs";
import beautify from "js-beautify";
import * as path from "path";
import * as fs from "fs";
import mkdirp from "mkdirp";

const argv = yargs(process.argv.slice(2))
  .scriptName("gabble")
  .usage("$0 -s <source_dir> -o <output_dir> [options]")
  .options({
    s: {
      type: "string",
      describe: "The source directory. Should contain the pages.",
      demandOption: true,
    },
    x: {
      type: "array",
      describe:
        "Directory names to exclude. For example, 'components'. This prevents all directories named 'components' inside the pages directory from being treated as pages.",
    },
    o: {
      type: "string",
      describe: "The output directory.",
      demandOption: true,
    },
    init: {
      type: "string",
      describe:
        "Require this file before compiling pages. This could be used to initialize the environment.",
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
  })
  .parseSync();

const sourceDir = path.resolve(argv.s);
const outputDir = path.resolve(argv.o);

const excludedPaths = (argv.x?.map((x) => x.toString()) || []).map(
  (excludedPath) =>
    excludedPath.startsWith("/") ? excludedPath : `/${excludedPath}`
);
const requireFile = argv.init ? path.resolve(argv.init) : undefined;

function getFiles(dir: string) {
  const files: string[] = [];

  const entries = fs.readdirSync(dir, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const excluded = excludedPaths.some((excludedPath) =>
      fullPath.endsWith(excludedPath)
    );
    if (entry.isDirectory()) {
      if (!excluded) {
        files.push(...getFiles(path.join(dir, entry.name)));
      }
    } else {
      if (!excluded) {
        files.push(path.join(dir, entry.name));
      }
    }
  }
  return files;
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

async function run() {
  const files = getFiles(sourceDir).filter((x) => x.endsWith(".js"));

  type PageResult = {
    path?: string;
    html: string;
  };

  if (requireFile) {
    await import(requireFile);
  }

  for (const file of files) {
    try {
      const relativePath = file.replace(sourceDir + "/", "");
      const pageGeneratorOpts = {
        filePath: file,
        relativePath,
      };

      const { default: page } = await import(file);
      const pageResult: PageResult[] | PageResult = await page(
        pageGeneratorOpts
      );

      if (Array.isArray(pageResult)) {
        for (const result of pageResult) {
          const newPath = path.resolve(
            outputDir,
            (result.path || relativePath).replace(/\.js$/, ".html")
          );
          writeFile(newPath, result.html);
          console.log(
            `Generated ${
              newPath.startsWith(process.cwd())
                ? newPath.substring(process.cwd().length + 1)
                : newPath
            }`
          );
        }
      } else {
        const newPath = path.resolve(
          outputDir,
          (pageResult.path || relativePath).replace(/\.js$/, ".html")
        );
        writeFile(newPath, pageResult.html);
        console.log(
          `Generated ${
            newPath.startsWith(process.cwd())
              ? newPath.substring(process.cwd().length + 1)
              : newPath
          }`
        );
      }
    } catch (ex) {
      console.log(ex.toString());
      console.log(`Skipped ${file}.`);
    }
  }
}

run();
