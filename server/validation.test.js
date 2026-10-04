// Run with: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isPositiveInteger, normaliseStudentEmail, validateEventInput } from './validation.js'

const event = {
  title: 'Intro to Web Accessibility',
  venue: 'SJH Auditorium',
  startsAt: '2026-10-02T05:00:00.000Z',
  capacity: 40,
  description: 'A hands-on session.',
}

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

test('a complete event passes, trimmed, with the date as ISO 8601', () => {
  const { value, error } = validateEventInput({ ...event, title: '  Git Rescue Clinic  ' })
  assert.equal(error, undefined)
  assert.equal(value.title, 'Git Rescue Clinic')
  assert.equal(value.startsAt, '2026-10-02T05:00:00.000Z')
  assert.equal(value.capacity, 40)
})

test('a new event needs every field', () => {
  assert.equal(validateEventInput({ ...event, title: '   ' }).error, 'Give the event a title')
  assert.equal(validateEventInput({ ...event, venue: '' }).error, 'Say where the event happens')
  assert.equal(validateEventInput({ ...event, startsAt: 'next Tuesday' }).error, 'Give a date and time for the event')
})

test('seats must be a whole number, at least one and at most 2000', () => {
  assert.equal(validateEventInput({ ...event, capacity: 0 }).error, 'Seats must be a whole number, at least 1')
  assert.equal(validateEventInput({ ...event, capacity: 2.5 }).error, 'Seats must be a whole number, at least 1')
  assert.equal(validateEventInput({ ...event, capacity: 5000 }).error, 'A venue holds at most 2000 seats')
  assert.equal(validateEventInput({ ...event, capacity: 1 }).error, undefined)
})

test('an edit changes only the fields it sends', () => {
  const { value, error } = validateEventInput({ venue: 'Covered Court' }, { partial: true })
  assert.equal(error, undefined)
  assert.deepEqual(value, { venue: 'Covered Court' })
  assert.equal(validateEventInput({}, { partial: true }).error, 'Nothing to change')
})

test('route ids accept whole numbers above zero', () => {
  assert.equal(isPositiveInteger('7'), true)
  assert.equal(isPositiveInteger(7), true)
  assert.equal(isPositiveInteger('0'), false)
  assert.equal(isPositiveInteger('-3'), false)
  assert.equal(isPositiveInteger('3.5'), false)
  assert.equal(isPositiveInteger('abc'), false)
})
