// Run with: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isPositiveInteger, normaliseStudentEmail } from './validation.js'

test('an HAU student address passes, trimmed and lower-cased', () => {
  assert.equal(normaliseStudentEmail('  Bea.Manalo@student.hau.edu.ph '), 'bea.manalo@student.hau.edu.ph')
  assert.equal(normaliseStudentEmail('jcruz2024@student.hau.edu.ph'), 'jcruz2024@student.hau.edu.ph')
})

test('any other domain fails, including a lookalike', () => {
  assert.equal(normaliseStudentEmail('bea@gmail.com'), null)
  assert.equal(normaliseStudentEmail('bea@hau.edu.ph'), null)
  assert.equal(normaliseStudentEmail('bea@student.hau.edu.ph.evil.com'), null)
  assert.equal(normaliseStudentEmail('bea@sub.student.hau.edu.ph'), null)
})

test('an empty or missing address fails', () => {
  assert.equal(normaliseStudentEmail(''), null)
  assert.equal(normaliseStudentEmail('   '), null)
  assert.equal(normaliseStudentEmail(undefined), null)
  assert.equal(normaliseStudentEmail(42), null)
  assert.equal(normaliseStudentEmail('@student.hau.edu.ph'), null)
})

test('route ids accept whole numbers above zero', () => {
  assert.equal(isPositiveInteger('7'), true)
  assert.equal(isPositiveInteger(7), true)
  assert.equal(isPositiveInteger('0'), false)
  assert.equal(isPositiveInteger('-3'), false)
  assert.equal(isPositiveInteger('3.5'), false)
  assert.equal(isPositiveInteger('abc'), false)
})
