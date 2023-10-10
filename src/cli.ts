#!/usr/bin/env node
import yargs from 'yargs'
import { main } from './main'

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
  .demandOption(['path', 'output'])
  .help()
  .alias('help', 'h').argv

if (argv.path === argv.output) {
  console.error(`Error: path and output cannot be the same`)
  process.exit(1)
}

main(argv.path, argv.output)
