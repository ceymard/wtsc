#!/usr/bin/env node

import _chalk from 'chalk'
import {spawn} from 'child_process'

const args = process.argv.slice(2)
const log = (s: string) => {
  for (var line of s.split('\n')) {
    if (line.trim() !== '') {
      process.stdout.write(line)
      if (!/^(\033[^m]+m)*$/.test(line))
        process.stdout.write('\n')
    }
  }
}

const chalk = _chalk.constructor({level: 3})
const h = (n: number) => chalk.hsl(n, 100, 60)
const c_file = h(0)
const c_line = h(130).bold
const c_end = chalk.rgb(22, 45, 43)
const c_module = h(180)
const c_any = h(40)
const c_param = h(60)
const c_prop = chalk.greenBright
const c_type = chalk.cyanBright
const basic = chalk.grey

type ReplacerFn = (...matches: string[]) => string

const mp = new Map<RegExp, ReplacerFn>()

mp.set(/(\s|\n)*^(.*?Compilation complete.*?)$(\s|\n)*/mg, (sp, line) => {
  return c_end.bold(`${line}`)
})

mp.set(/Property '([^']*)'/ig, (match) => {
  return `Property ${c_prop(match)}`
})

mp.set(/type '([^']*)'/ig, (match) => {
  return `type ${c_type(match)}`
})

mp.set(/module '([^']*)'/ig, (match) => {
  return `module ${c_module(match)}`
})

mp.set(/'any' type/, () => {
  return `${c_any('any')} type`
})

mp.set(/Parameter '([^']*)'/, (match) => {
  return `parameter ${c_param(match)}`
})

mp.set(/Error TS\d+: /gi, () => '')


// Files
mp.set(/^([^\(\n]+\/)?([^\(\n)]+)\((\d+),(\d+)\):/gm, (path, file, line, col) => {
  return `${path ? c_file(path) : ''}${c_file.bold(file)} ${c_line(line)}: `
})

var tsc = spawn('tsc', args)

tsc.stdout.on('data', (_out: Buffer) => {
  var out = _out.toString('utf-8')
  mp.forEach((fn, reg) => {
    out = out.replace(reg, (str, ...matches) => {
      return fn(...matches)
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
