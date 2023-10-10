#!/usr/bin/env node
import { foo } from './main'
import yargs from 'yargs'

const argv = yargs
  .option('path', {
    alias: 'p',
    description: 'Specify the path',
    type: 'string',
  })
  .help()
  .alias('help', 'h').argv

foo(argv.path || '')
