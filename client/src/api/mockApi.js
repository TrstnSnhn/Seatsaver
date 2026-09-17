// The simulated backend.
//
// Same function names, same return shapes, and the same kind of failure as
// httpApi.js, so components cannot tell the difference. Data lives in the
// visitor's own browser and goes no further.

import seed from './seed.json'
import { ApiError, PROBLEM_MESSAGES, reservationProblem } from './rules.js'

const KEY = 'seatsaver:db:v1'

// A real network is not instant. The delay keeps the loading states honest.
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

// Seed events carry a count of reservations by students outside the demo
// picker. Expand them into real reservation rows so every count is derived
// from reservations, the same way the database will count them.
function buildInitialDb() {
  const guestRsvps = seed.events.flatMap((event) =>
    Array.from({ length: event.seededReservations }, (_, index) => ({
      id: `guest-${event.id}-${index}`,
      eventId: event.id,
      studentId: `guest-${event.id}-${index}`,
      createdAt: '2026-09-15T00:00:00.000Z',
    }))
  )
  const events = seed.events.map(({ seededReservations, ...event }) => event)
  return { orgs: seed.orgs, students: seed.students, events, rsvps: [...guestRsvps, ...seed.rsvps] }
}

function readDb() {
  const stored = localStorage.getItem(KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // Corrupted storage. Start again rather than crashing the app.
      localStorage.removeItem(KEY)
    }
  }
  return writeDb(buildInitialDb())
}

function writeDb(db) {
  localStorage.setItem(KEY, JSON.stringify(db))
  return db
}

function withDetails(db, event) {
  const org = db.orgs.find((candidate) => candidate.id === event.orgId)
  const seatsTaken = db.rsvps.filter((rsvp) => rsvp.eventId === event.id).length
  return {
    ...event,
    orgName: org?.name ?? 'Unknown org',
    orgShortName: org?.shortName ?? '',
    seatsTaken,
  }
}

function findEvent(db, id) {
  const event = db.events.find((candidate) => candidate.id === id)
  if (!event) throw new ApiError('Event not found', 404)
  return event
}

const bySoonest = (a, b) => a.startsAt.localeCompare(b.startsAt)

export async function listOrgs() {
  await delay()
  return readDb().orgs
}

export async function listStudents() {
  await delay()
  return readDb().students
}

export async function listEvents({ orgId = '', from = '', to = '', q = '' } = {}) {
  await delay()
  const db = readDb()
  const query = q.trim().toLowerCase()
  return db.events
    .filter((event) => !orgId || event.orgId === orgId)
    .filter((event) => !from || event.startsAt.slice(0, 10) >= from)
    .filter((event) => !to || event.startsAt.slice(0, 10) <= to)
    .filter((event) => !query || event.title.toLowerCase().includes(query))
    .sort(bySoonest)
    .map((event) => withDetails(db, event))
}

export async function getEvent(id) {
  await delay()
  const db = readDb()
  return withDetails(db, findEvent(db, id))
}

export async function reserveSeat(eventId, studentId) {
  await delay()
  const db = readDb()
  const event = findEvent(db, eventId)
  const reservations = db.rsvps.filter((rsvp) => rsvp.eventId === eventId)
  const problem = reservationProblem({
    capacity: event.capacity,
    seatsTaken: reservations.length,
    alreadyReserved: reservations.some((rsvp) => rsvp.studentId === studentId),
  })
  if (problem) throw new ApiError(PROBLEM_MESSAGES[problem], 409)

  const created = {
    id: crypto.randomUUID(),
    eventId,
    studentId,
    createdAt: new Date().toISOString(),
  }
  writeDb({ ...db, rsvps: [...db.rsvps, created] })
  return created
}

export async function cancelSeat(eventId, studentId) {
  await delay()
  const db = readDb()
  const remaining = db.rsvps.filter(
    (rsvp) => !(rsvp.eventId === eventId && rsvp.studentId === studentId)
  )
  if (remaining.length === db.rsvps.length) {
    throw new ApiError('No reservation to cancel', 404)
  }
  writeDb({ ...db, rsvps: remaining })
  return null
}

export async function listStudentSeats(studentId) {
  await delay()
  const db = readDb()
  return db.rsvps
    .filter((rsvp) => rsvp.studentId === studentId)
    .map((rsvp) => ({ ...withDetails(db, findEvent(db, rsvp.eventId)), reservedAt: rsvp.createdAt }))
    .sort(bySoonest)
}
