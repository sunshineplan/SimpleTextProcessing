export class tasks {
  tasks: textProcessor[]
  constructor(...tasks: textProcessor[]) {
    this.tasks = tasks
  }
  append(...tasks: textProcessor[]) {
    this.tasks.push(...tasks)
  }
  process(s: string) {
    let output = s
    let first = true
    while (true) {
      for (const task of this.tasks)
        if (first || !task.once()) s = task.process(s)
      if (s === output) return output
      else output = s
      if (first) first = false
    }
  }
  processAll(s: string[]) {
    const output = []
    for (const i of s) {
      const s = this.process(i)
      output.push(s)
    }
    return output
  }
}

export class removeByRegExp implements textProcessor {
  re: RegExp
  constructor(re: RegExp) {
    if (!re.global) re = new RegExp(re, 'g')
    this.re = re
  }
  once() { return false }
  process(s: string) {
    return s.replaceAll(this.re, '')
  }
}

export class cut implements textProcessor {
  sep: string
  constructor(sep: string) {
    this.sep = sep
  }
  once() { return true }
  process(s: string) {
    const index = s.indexOf(this.sep)
    if (index === -1) {
      return s
    }
    return s.substring(0, index)
  }
}

export class trim implements textProcessor {
  cutset: string
  constructor(cutset: string) {
    this.cutset = cutset
  }
  once() { return false }
  process(s: string) {
    return s.replaceAll(new RegExp(`^[${this.cutset}]+|[${this.cutset}]+$`, 'g'), '')
  }
}

class processor implements textProcessor {
  isOnce: boolean
  fn: (s: string) => string
  constructor(once: boolean, fn: (s: string) => string) {
    this.isOnce = once
    this.fn = fn
  }
  once() { return this.isOnce }
  process(s: string) {
    return this.fn(s)
  }
}

export const trimSpace = new processor(false, (s: string) => s.trim())

export const cutSpace = new processor(true, (s: string) => {
  const matches = s.match(/\S+/g)
  if (!matches) {
    return ''
  }
  return matches[0]
})

export const removeParentheses = new tasks(new removeByRegExp(/\([^)]*\)/), new removeByRegExp(/（[^）]*）/))

const escapeRegExp = (s: string) => {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
