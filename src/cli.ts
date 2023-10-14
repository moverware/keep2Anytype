#!/usr/bin/env node
import yargs from 'yargs'
import { main } from './main'

export type Mode = 'pages' | 'mixed'
export interface Settings {
  path: string
  output: string
  mode: Mode
  includeArchive: boolean
}

const isMode = (mode: any): mode is Mode => {
  return mode === 'pages' || mode === 'mixed'
}

const argv = yargs
  .option('path', {
    alias: 'p',
    description: 'Specify the path',
    type: 'string',
  })
  .option('output', {
    alias: 'o',
    description: 'Specify the output path',
    type: 'string',
  })
  .option('mode', {
    alias: 'm',
    description: 'Specify the mode',
    choices: ['pages', 'mixed'],
    default: 'mixed',
  })
  .option('archive', {
    alias: 'a',
    description: 'Include archived Keep notes',
    type: 'boolean',
    default: false,
  })
  .demandOption(['path', 'output'])
  .help()
  .alias('help', 'h').argv

if (argv.path === argv.output) {
  console.error(`Error: path and output cannot be the same`)
  process.exit(1)
}

if (!isMode(argv.mode)) {
  console.error('Invalid mode')
  process.exit(1)
}

const settings: Settings = {
  path: argv.path,
  output: argv.output,
  mode: argv.mode,
  includeArchive: argv.archive,
}
main(settings)
