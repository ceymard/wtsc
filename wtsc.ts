#!/usr/bin/env node

import _chalk from 'chalk'

const log = (s: string) => {
  process.stdout.write(s.replace('\x1Bc', ''))
}

const chalk = _chalk.constructor({level: 3})
const h = (n: number) => chalk.hsl(n, 60, 60)
const c_file = h(0)
const c_line = h(130).bold
const c_end = chalk.hsl(30, 30, 40) // orange
const c_module = h(180)
const c_any = h(40)
const c_param = h(60) // yellow
const c_prop = h(200) // cyan
const c_type = h(120) // green
const basic = chalk.grey

type ReplacerFn = (...matches: string[]) => string

const mp = new Map<RegExp, ReplacerFn>()

mp.set(/(\s|\n|^)*(.*?file change detected.*?)$(\s|\n)*/mgi, (sp, line) => {
  return c_end(`<<< change detected`) + '\n'
})

mp.set(/(\s|\n|^)*(.*?Compilation complete.*?)$(\s|\n)*/mgi, (sp, line) => {
  return c_end(`>>> done`) + '\n'
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

mp.set(/'([^']*)' is declared/g, (match) => {
  return `${c_param(match)} is declared`
})

mp.set(/Error TS\d+: /gi, () => '')


// Files
mp.set(/^([^\(\n]+\/)?([^\(\n)]+)\((\d+),(\d+)\):/gm, (path, file, line, col) => {
  return `${path ? c_file(path) : ''}${c_file.bold(file)} ${c_line(line)}: `
})


process.stdin.on('data', (_out: Buffer) => {
  var out = _out.toString('utf-8')
  mp.forEach((fn, reg) => {
    out = out.replace(reg, (str, ...matches) => {
      return fn(...matches)
    })
  })
  log(basic(out.trim()) + '\n')
})
