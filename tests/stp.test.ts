import { expect, test } from 'vitest'
import * as stp from '../src/stp'

test('Remove By RegExp', () => {
  expect(new stp.removeByRegExp(new RegExp('')).process('')).toBe('')
  expect(new stp.removeByRegExp(/\d+/).process('abc123')).toBe('abc')
  expect(new stp.removeByRegExp(/\d+$/).process('123abc456')).toBe('123abc')
})

test('Extract By RegExp', () => {
  expect(new stp.extractByRegExp(/\d+/).process('Order 123456 and 789')).toBe('123456');
  expect(new stp.extractByRegExp(/[A-Z]+/).process('all lowercase')).toBe('');
  expect(new stp.extractByRegExp(/\w+$/).process('File is ready.txt')).toBe('txt');
  expect(new stp.extractByRegExp(/[\w.]+@\w+\.com/).process('Contact user@domain.com now!')).toBe('user@domain.com');
  expect(new stp.extractByRegExp(/\w+/).process('')).toBe('');
  expect(new stp.extractByRegExp(/\w+/g).process('first second third')).toBe('first');
});

test('Cut', () => {
  expect(new stp.cut('').process('')).toBe('')
  expect(new stp.cut(' ').process('abc 123')).toBe('abc')
  expect(new stp.cut(' ').process(' abc 123')).toBe('')
  expect(new stp.cut('abc').process('123abc456')).toBe('123')
})

test('Trim', () => {
  expect(new stp.trim('').process('')).toBe('')
  expect(new stp.trim(' ').process(' abc 123 ')).toBe('abc 123')
  expect(new stp.trim(' ').process(' abc 123\n')).toBe('abc 123\n')
  expect(new stp.trim(' \n').process(' abc 123\n')).toBe('abc 123')
})

test('Trim Space', () => {
  expect(stp.trimSpace.process('')).toBe('')
  expect(stp.trimSpace.process(' abc')).toBe('abc')
  expect(stp.trimSpace.process('abc\n')).toBe('abc')
  expect(stp.trimSpace.process('a b c')).toBe('a b c')
})

test('Cut Space', () => {
  expect(stp.cutSpace.process('')).toBe('')
  expect(stp.cutSpace.process(' abc')).toBe('abc')
  expect(stp.cutSpace.process('abc def')).toBe('abc')
  expect(stp.cutSpace.process('abc\ndef')).toBe('abc')
})

test('Remove Parentheses', () => {
  expect(stp.removeParentheses.process('')).toBe('')
  expect(stp.removeParentheses.process('abc')).toBe('abc')
  expect(stp.removeParentheses.process('abc（123）')).toBe('abc')
  expect(stp.removeParentheses.process('abc（123)')).toBe('abc（123)')
  expect(stp.removeParentheses.process('abc(123)def')).toBe('abcdef')
})

test('Tasks', () => {
  const task = new stp.tasks(stp.trimSpace, ...stp.removeParentheses.tasks, stp.cutSpace)
  expect(task.process('')).toBe('')
  expect(task.process(' abc(123)\n')).toBe('abc')
  expect(task.process('abc (123)')).toBe('abc')
  expect(task.process('(123)abc')).toBe('abc')
})
