#!/usr/bin/env node

import _chalk from 'chalk'
import {spawn} from 'child_process'

const args = process.argv.slice(2)
const log = (s: string) => process.stdout.write(s)

const chalk = _chalk.constructor({level: 3})
const h = (n: number) => chalk.hsl(n, 100, 60)
const c_file = h(0)
const c_line = h(130).bold
const c_end = chalk.rgb(22, 45, 43)
const c_prop = chalk.greenBright
const c_type = chalk.cyanBright
const basic = chalk.grey

type ReplacerFn = (matches: string[]) => string

const mp = new Map<RegExp, ReplacerFn>()

mp.set(/(\s|\n)*^(.*?Compilation complete.*?)$(\s|\n)*/mg, ([sp, line]) => {
  return c_end.bold(`\n  ${line}\n`)
})

mp.set(/Property '([^']*)'/ig, ([match]) => {
  return `Property ${c_prop(match)}`
})

mp.set(/type '([^']*)'/ig, ([match]) => {
  return `type ${c_type(match)}`
})

mp.set(/Error TS\d+: /gi, () => '')


// Files
mp.set(/^([^\(\n]+\/)?([^\(\n)]+)\((\d+),(\d+)\):/gm, ([path, file, line, col]) => {
  return `${path ? c_file(path) : ''}${c_file.bold(file)} ${c_line(line)}:\n`
})

var tsc = spawn('tsc', args)

tsc.stdout.on('data', (_out: Buffer) => {
  var out = _out.toString('utf-8')
  mp.forEach((fn, reg) => {
    out = out.replace(reg, (str, ...matches) => {
      return fn(matches)
    })
  })
  log(basic(out))
})

tsc.stderr.on('data', err => {
  // log(`err: ${err}`)
})

tsc.on('close', (code, signal) => {
  // log(`exited with ${code}, ${signal}`)
})
