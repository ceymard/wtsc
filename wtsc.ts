#!/usr/bin/env node

import _chalk from 'chalk'
import { ChildProcess, spawn } from 'child_process'

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
  return `${path ? c_file(path) : ''}${c_file.bold(file)}:${c_line(line)}: `
})

// Command to be relaunched
const command = process.argv.slice(2)
const should_run_command = command.length > 0
var running_process: null | ChildProcess = null
var should_rerun = false

const runcmd = command.length === 0 ? () => {} : debounce(() => {
  if (running_process != null) {
    should_rerun = true
    return
  }
  const [exe, ...args] = command
  running_process = spawn(exe, args, {
    stdio: 'inherit'
  })
  running_process.on('exit', () => {
    running_process = null
    if (should_rerun) runcmd()
    should_rerun = false
  })
}, 50)


var already_ran = false
process.stdin.on('data', (_out: Buffer) => {
  var out = _out.toString('utf-8')
  mp.forEach((fn, reg) => {
    out = out.replace(reg, (_, ...matches) => {
      return fn(...matches)
    })
  })

  if (!already_ran) {
    runcmd()
    already_ran = true
  }

  if (should_run_command && out.includes('Watching for file changes.')) {
    already_ran = false
  }

  log(basic(out.trim()) + '\n')
})


// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func: Function, wait: number, immediate: boolean = false) {
	var timeout: NodeJS.Timer | null;
	return function(this: any) {
		var context = this, args = Array.from(arguments);
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var call_now = immediate && !timeout;
		if (timeout != null) clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (call_now) func.apply(context, args);
	};
};
