// Run with: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normaliseStudentEmail, reservationProblem, seatsLeft } from './rules.js'

test('seatsLeft counts down and never goes below zero', () => {
  assert.equal(seatsLeft(40, 18), 22)
  assert.equal(seatsLeft(30, 30), 0)
  assert.equal(seatsLeft(30, 31), 0)
})

test('a student with no seat may reserve while seats remain', () => {
  assert.equal(reservationProblem({ capacity: 25, seatsTaken: 24, alreadyHolds: false }), null)
})

test('the last seat taken makes the event full', () => {
  assert.equal(reservationProblem({ capacity: 25, seatsTaken: 25, alreadyHolds: false }), 'full')
})

test('a second request by the same student is a duplicate, even when full', () => {
  assert.equal(reservationProblem({ capacity: 25, seatsTaken: 10, alreadyHolds: true }), 'duplicate')
  assert.equal(reservationProblem({ capacity: 25, seatsTaken: 25, alreadyHolds: true }), 'duplicate')
})

test('an HAU student address passes, trimmed and lower-cased', () => {
  assert.equal(normaliseStudentEmail('  Bea.Manalo@student.hau.edu.ph '), 'bea.manalo@student.hau.edu.ph')
})

test('any other domain fails, including a lookalike', () => {
  assert.equal(normaliseStudentEmail('bea@gmail.com'), null)
  assert.equal(normaliseStudentEmail('bea@hau.edu.ph'), null)
  assert.equal(normaliseStudentEmail('bea@student.hau.edu.ph.evil.com'), null)
  assert.equal(normaliseStudentEmail(''), null)
  assert.equal(normaliseStudentEmail(undefined), null)
})
