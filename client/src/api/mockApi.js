// The simulated backend.
//
// Same function names, same return shapes, and the same kind of failure as
// httpApi.js, so the screens cannot tell the difference. Data lives in the
// visitor's own browser and goes no further.

import seed from './seed.json'
import {
  ApiError,
  HOLD_STATUSES,
  PROBLEM_MESSAGES,
  normaliseStudentEmail,
  reservationProblem,
} from './rules.js'
import { readOfficerKey } from './officerKey.js'

const KEY = 'seatsaver:db:v2'

// A real network is not instant. The delay keeps the loading states honest.
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

// Seed events carry a count of seats held by students outside the demo picker.
// Expand them into reservation rows so every count comes from reservations, the
// same way the database counts them.
function buildInitialDb() {
  const guestReservations = seed.events.flatMap((event) =>
    Array.from({ length: event.seededReservations }, (_, index) => ({
      id: `guest-${event.id}-${index}`,
      eventId: event.id,
      studentId: `guest-${event.id}-${index}`,
      status: 'approved',
      requestedAt: '2026-09-18T00:00:00.000Z',
      decidedAt: '2026-09-19T00:00:00.000Z',
    }))
  )
  const events = seed.events.map(({ seededReservations, ...event }) => event)
  return {
    orgs: seed.orgs,
    students: seed.students,
    events,
    reservations: [...guestReservations, ...seed.reservations],
  }
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

const holds = (reservation) => HOLD_STATUSES.includes(reservation.status)

function withDetails(db, event) {
  const org = db.orgs.find((candidate) => candidate.id === event.orgId)
  const seatsTaken = db.reservations.filter(
    (reservation) => reservation.eventId === event.id && holds(reservation)
  ).length
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

// The Manila calendar date, to compare with the date filters.
const manilaDate = (iso) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))

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
    .filter((event) => !from || manilaDate(event.startsAt) >= from)
    .filter((event) => !to || manilaDate(event.startsAt) <= to)
    .filter((event) => !query || event.title.toLowerCase().includes(query))
    .sort(bySoonest)
    .map((event) => withDetails(db, event))
}

export async function getEvent(id) {
  await delay()
  const db = readDb()
  return withDetails(db, findEvent(db, id))
}

// Checks the HAU domain, then the roster, then the seat rules, in that order,
// and answers with the same status codes the API sends.
export async function requestSeat(eventId, rawEmail) {
  await delay()
  const db = readDb()
  const event = findEvent(db, eventId)

  const email = normaliseStudentEmail(rawEmail)
  if (!email) throw new ApiError(PROBLEM_MESSAGES.domain, 400)

  const student = db.students.find((candidate) => candidate.email === email)
  if (!student) throw new ApiError(PROBLEM_MESSAGES.roster, 403)

  const forEvent = db.reservations.filter((reservation) => reservation.eventId === eventId)
  const existing = forEvent.find((reservation) => reservation.studentId === student.id)
  const problem = reservationProblem({
    capacity: event.capacity,
    seatsTaken: forEvent.filter(holds).length,
    alreadyHolds: Boolean(existing) && holds(existing),
  })
  if (problem) throw new ApiError(PROBLEM_MESSAGES[problem], 409)

  const created = {
    id: crypto.randomUUID(),
    eventId,
    studentId: student.id,
    status: 'pending',
    requestedAt: new Date().toISOString(),
    decidedAt: null,
  }
  writeDb({
    ...db,
    reservations: [...db.reservations.filter((reservation) => reservation !== existing), created],
  })
  return { ...created, student }
}

export async function cancelSeat(eventId, studentId) {
  await delay()
  const db = readDb()
  const remaining = db.reservations.filter(
    (reservation) =>
      !(reservation.eventId === eventId && reservation.studentId === studentId && holds(reservation))
  )
  if (remaining.length === db.reservations.length) {
    throw new ApiError('No reservation to cancel', 404)
  }
  writeDb({ ...db, reservations: remaining })
  return null
}

export async function listStudentSeats(studentId) {
  await delay()
  const db = readDb()
  return db.reservations
    .filter((reservation) => reservation.studentId === studentId && holds(reservation))
    .map((reservation) => ({
      ...withDetails(db, findEvent(db, reservation.eventId)),
      status: reservation.status,
      requestedAt: reservation.requestedAt,
    }))
    .sort(bySoonest)
}

export async function listRequests(status = 'pending') {
  await delay()
  const db = readDb()
  return db.reservations
    .filter((reservation) => reservation.status === status)
    .map((reservation) => {
      const event = withDetails(db, findEvent(db, reservation.eventId))
      const student = db.students.find((candidate) => candidate.id === reservation.studentId)
      return {
        id: reservation.id,
        status: reservation.status,
        requestedAt: reservation.requestedAt,
        decidedAt: reservation.decidedAt,
        studentName: student?.name ?? 'Unknown student',
        studentEmail: student?.email ?? '',
        studentNo: student?.studentNo ?? '',
        eventId: event.id,
        eventTitle: event.title,
        eventVenue: event.venue,
        eventStartsAt: event.startsAt,
        capacity: event.capacity,
        seatsTaken: event.seatsTaken,
      }
    })
    .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt))
}

// Officer routes.
//
// Demo mode has no server to hold a secret, so any non-empty key opens the
// dashboard here. The real API checks the key against its own environment, and
// that is the check that matters.
export async function checkOfficerKey() {
  await delay()
  if (!readOfficerKey()) throw new ApiError('That officer key is wrong.', 401)
  return { ok: true }
}

export async function createEvent(orgId, fields) {
  await delay()
  const db = readDb()
  if (!db.orgs.some((org) => org.id === orgId)) throw new ApiError('No such org', 404)

  const created = { id: crypto.randomUUID(), orgId, description: '', ...fields }
  const events = [...db.events, created]
  writeDb({ ...db, events })
  return withDetails({ ...db, events }, created)
}

export async function updateEvent(eventId, fields) {
  await delay()
  const db = readDb()
  const current = withDetails(db, findEvent(db, eventId))

  if (fields.capacity !== undefined && fields.capacity < current.seatsTaken) {
    throw new ApiError(
      `${current.seatsTaken} seats are already held. Reject some requests before lowering the limit.`,
      409
    )
  }

  const events = db.events.map((event) => (event.id === eventId ? { ...event, ...fields } : event))
  writeDb({ ...db, events })
  return withDetails({ ...db, events }, events.find((event) => event.id === eventId))
}

export async function deleteEvent(eventId) {
  await delay()
  const db = readDb()
  findEvent(db, eventId)
  writeDb({
    ...db,
    events: db.events.filter((event) => event.id !== eventId),
    // The database cascades; here the rows are removed by hand.
    reservations: db.reservations.filter((reservation) => reservation.eventId !== eventId),
  })
  return null
}

export async function listAttendees(eventId) {
  await delay()
  const db = readDb()
  return db.reservations
    .filter((reservation) => reservation.eventId === eventId && holds(reservation))
    .map((reservation) => {
      const student = db.students.find((candidate) => candidate.id === reservation.studentId)
      return {
        id: reservation.studentId,
        name: student?.name ?? 'Guest student',
        email: student?.email ?? '',
        studentNo: student?.studentNo ?? '',
        status: reservation.status,
        requestedAt: reservation.requestedAt,
      }
    })
    .sort((a, b) => a.status.localeCompare(b.status) || a.name.localeCompare(b.name))
}

export async function listReport(limit = 10) {
  await delay()
  const db = readDb()
  return db.events
    .map((event) => {
      const mine = db.reservations.filter((reservation) => reservation.eventId === event.id)
      const detailed = withDetails(db, event)
      return {
        id: event.id,
        title: event.title,
        venue: event.venue,
        startsAt: event.startsAt,
        capacity: event.capacity,
        orgName: detailed.orgName,
        requests: mine.length,
        seatsTaken: detailed.seatsTaken,
        rejected: mine.filter((reservation) => reservation.status === 'rejected').length,
      }
    })
    .sort((a, b) => b.requests - a.requests || a.startsAt.localeCompare(b.startsAt))
    .slice(0, limit)
}

export async function decideRequest(requestId, decision) {
  await delay()
  const db = readDb()
  const target = db.reservations.find(
    (reservation) => reservation.id === requestId && reservation.status === 'pending'
  )
  if (!target) throw new ApiError('No pending request with that id', 404)

  const decided = {
    ...target,
    status: decision === 'approve' ? 'approved' : 'rejected',
    decidedAt: new Date().toISOString(),
  }
  writeDb({
    ...db,
    reservations: db.reservations.map((reservation) =>
      reservation.id === requestId ? decided : reservation
    ),
  })
  return decided
}
