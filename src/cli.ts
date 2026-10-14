#!/usr/bin/env node
import { existsSync } from "node:fs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { main, type Mode } from "./main";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const argv = yargs(hideBin(process.argv))
  .option("path", {
    alias: "p",
    description: "Path to the Google Keep export folder",
    type: "string",
    demandOption: true,
  })
  .option("output", {
    alias: "o",
    description: "Folder to write the Any-Block files to",
    type: "string",
    demandOption: true,
  })
  .option("mode", {
    alias: "m",
    description:
      "pages: every note becomes a page; mixed: untitled notes become notes",
    choices: ["pages", "mixed"] as const satisfies Mode[],
    default: "mixed" as Mode,
  })
  .option("archive", {
    alias: "a",
    description: "Include archived Keep notes",
    type: "boolean",
    default: false,
  })
  .option("trashed", {
    alias: "t",
    description: "Include trashed Keep notes",
    type: "boolean",
    default: false,
  })
  .option("emoji", {
    alias: "e",
    description: "Icon emoji for every converted object",
    type: "string",
    default: "",
  })
  .option("metadata", {
    alias: "d",
    description:
      "Write the note's colour, pinned/archived/trashed state and labels to its description",
    type: "boolean",
    default: false,
  })
  .option("relation", {
    alias: "r",
    description:
      "Show the description relation in the body of the object. Only works with --metadata.",
    type: "boolean",
    default: false,
  })
  .check((args) => {
    if (args.path === args.output) {
      throw new Error("--path and --output must be different folders");
    }
    return true;
  })
  .strict()
  .help()
  .alias("help", "h")
  .parseSync();

try {
  const failures = await main({
    path: argv.path,
    output: argv.output,
    mode: argv.mode,
    includeArchive: argv.archive,
    includeTrashed: argv.trashed,
    includeMetadata: argv.metadata,
    includeRelation: argv.relation,
    emoji: argv.emoji,
    tagId: process.env.TAG_ID ?? "",
  });
  if (failures > 0) {
    console.error(`${failures} note(s) failed to convert`);
    process.exitCode = 1;
  }
} catch (error) {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
