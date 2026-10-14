#!/usr/bin/env node
import yargs from "yargs";
import { main } from "./main";

export type Mode = "pages" | "mixed";
export interface Settings {
  path: string;
  output: string;
  mode: Mode;
  includeArchive: boolean;
  includeTrashed: boolean;
  includeMetadata: boolean;
  includeRelation: boolean;
  emoji: string;
}

const isMode = (mode: any): mode is Mode => {
  return mode === "pages" || mode === "mixed";
};

const argv = yargs
  .option("path", {
    alias: "p",
    description: "Specify the path",
    type: "string",
  })
  .option("output", {
    alias: "o",
    description: "Specify the output path",
    type: "string",
  })
  .option("mode", {
    alias: "m",
    description: "Specify the mode",
    choices: ["pages", "mixed"],
    default: "mixed",
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
    description: "Include emoji in the output",
    type: "string",
    default: "",
  })
  .option("metadata", {
    alias: "d",
    description: "Include additional metadata in the output",
    type: "boolean",
    default: false,
  })
  .option("relation", {
    alias: "r",
    description:
      "Include the description relation in the body of the object. Only works if metadata is enabled.",
    type: "boolean",
    default: false,
  })
  .demandOption(["path", "output"])
  .help()
  .alias("help", "h").argv;

console.log("Settings:", argv);

if (argv.path === argv.output) {
  console.error(`Error: path and output cannot be the same`);
  process.exit(1);
}

if (!isMode(argv.mode)) {
  console.error("Invalid mode");
  process.exit(1);
}

const settings: Settings = {
  path: argv.path,
  output: argv.output,
  mode: argv.mode,
  includeArchive: argv.archive,
  includeTrashed: argv.trashed,
  includeMetadata: argv.metadata,
  includeRelation: argv.relation,
  emoji: argv.emoji,
};
main(settings);
