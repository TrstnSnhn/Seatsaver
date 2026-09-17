// Run with: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { seatsLeft, reservationProblem } from './rules.js'

test('seatsLeft counts down and never goes below zero', () => {
  assert.equal(seatsLeft(40, 18), 22)
  assert.equal(seatsLeft(30, 30), 0)
  assert.equal(seatsLeft(30, 31), 0)
})

test('a student with no seat may reserve while seats remain', () => {
  assert.equal(reservationProblem({ capacity: 25, seatsTaken: 24, alreadyReserved: false }), null)
})

test('the last seat taken makes the event full', () => {
  assert.equal(reservationProblem({ capacity: 25, seatsTaken: 25, alreadyReserved: false }), 'full')
})

test('a second reservation by the same student is a duplicate, even when full', () => {
  assert.equal(reservationProblem({ capacity: 25, seatsTaken: 10, alreadyReserved: true }), 'duplicate')
  assert.equal(reservationProblem({ capacity: 25, seatsTaken: 25, alreadyReserved: true }), 'duplicate')
})
