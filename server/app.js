import express from 'express'
import cors from 'cors'
import * as repos from './repos.js'
import {
  isPositiveInteger,
  normaliseStudentEmail,
  validateEventInput,
  HAU_STUDENT_DOMAIN,
} from './validation.js'

// The database speaks snake_case and the client speaks camelCase. One place
// translates, so no screen has to know the column names.
const toEvent = (row) => ({
  id: String(row.id),
  orgId: row.org_id,
  orgName: row.org_name,
  orgShortName: row.org_short_name,
  title: row.title,
  venue: row.venue,
  startsAt: row.starts_at,
  capacity: row.capacity,
  seatsTaken: row.seats_taken,
  description: row.description,
})

const toStudent = (row) => ({
  id: String(row.id),
  name: row.name,
  email: row.email,
  studentNo: row.student_no,
  isAdmin: row.is_admin,
})

const toAttendee = (row) => ({
  id: String(row.id),
  name: row.name,
  email: row.email,
  studentNo: row.student_no,
  status: row.status,
  requestedAt: row.requested_at,
})

const toReportRow = (row) => ({
  id: String(row.id),
  title: row.title,
  venue: row.venue,
  startsAt: row.starts_at,
  capacity: row.capacity,
  orgName: row.org_name,
  requests: row.requests,
  seatsTaken: row.seats_taken,
  rejected: row.rejected,
})

const toRequest = (row) => ({
  id: String(row.id),
  status: row.status,
  requestedAt: row.requested_at,
  decidedAt: row.decided_at,
  studentName: row.student_name,
  studentEmail: row.student_email,
  studentNo: row.student_no,
  eventId: String(row.event_id),
  eventTitle: row.event_title,
  eventVenue: row.event_venue,
  eventStartsAt: row.event_starts_at,
  capacity: row.event_capacity,
  seatsTaken: row.seats_taken,
})

export function createApp(pool) {
  const app = express()

  // CORS before the routes, with named origins. cors() with no options would
  // let any site on the internet call this API from a visitor's browser.
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  app.use(cors({ origin: allowedOrigins }))
  app.use(express.json({ limit: '100kb' }))

  // Is the process alive?
  app.get('/healthz', (request, response) => response.json({ ok: true }))

  // Is the database reachable? The question that says which half is broken.
  app.get('/readyz', async (request, response) => {
    try {
      await pool.query('SELECT 1')
      response.json({ ok: true, db: 'up' })
    } catch (error) {
      console.error('readyz failed:', error.message)
      response.status(503).json({ ok: false, db: 'down' })
    }
  })

  app.get('/api/orgs', async (request, response, next) => {
    try {
      const rows = await repos.listOrgs(pool)
      response.json(rows.map((row) => ({ id: row.id, name: row.name, shortName: row.short_name })))
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/students', async (request, response, next) => {
    try {
      response.json((await repos.listStudents(pool)).map(toStudent))
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/events', async (request, response, next) => {
    try {
      const { org = '', from = '', to = '', q = '' } = request.query
      const rows = await repos.listEvents(pool, { orgId: String(org), from: String(from), to: String(to), q: String(q) })
      response.json(rows.map(toEvent))
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/events/:id', async (request, response, next) => {
    try {
      if (!isPositiveInteger(request.params.id)) {
        return response.status(400).json({ error: 'Event id must be a number' })
      }
      const row = await repos.getEvent(pool, Number(request.params.id))
      if (!row) return response.status(404).json({ error: 'Event not found' })
      response.json(toEvent(row))
    } catch (error) {
      next(error)
    }
  })

  // Request a seat. The HAU address is checked here, then matched against the
  // student roster, before any seat is held.
  app.post('/api/events/:id/rsvps', async (request, response, next) => {
    try {
      if (!isPositiveInteger(request.params.id)) {
        return response.status(400).json({ error: 'Event id must be a number' })
      }

      const email = normaliseStudentEmail(request.body?.email)
      if (!email) {
        return response.status(400).json({ error: `Use your HAU student address, ending in ${HAU_STUDENT_DOMAIN}` })
      }

      const student = await repos.findStudentByEmail(pool, email)
      if (!student) {
        return response.status(403).json({ error: 'That address is not on the student roster. Ask your org officer to add you.' })
      }

      const { problem, reservation } = await repos.requestSeat(pool, {
        eventId: Number(request.params.id),
        studentId: student.id,
      })

      if (problem === 'not_found') return response.status(404).json({ error: 'Event not found' })
      if (problem === 'duplicate') return response.status(409).json({ error: 'You already have a request for this event.' })
      if (problem === 'full') return response.status(409).json({ error: 'This event is full.' })

      response.status(201).json({
        id: String(reservation.id),
        eventId: String(reservation.event_id),
        studentId: String(reservation.student_id),
        status: reservation.status,
        requestedAt: reservation.requested_at,
        student: toStudent(student),
      })
    } catch (error) {
      next(error)
    }
  })

  app.delete('/api/events/:id/rsvps/:studentId', async (request, response, next) => {
    try {
      if (!isPositiveInteger(request.params.id) || !isPositiveInteger(request.params.studentId)) {
        return response.status(400).json({ error: 'Ids must be numbers' })
      }
      const removed = await repos.cancelSeat(pool, {
        eventId: Number(request.params.id),
        studentId: Number(request.params.studentId),
      })
      if (!removed) return response.status(404).json({ error: 'No reservation to cancel' })
      response.status(204).end()
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/students/:id/rsvps', async (request, response, next) => {
    try {
      if (!isPositiveInteger(request.params.id)) {
        return response.status(400).json({ error: 'Student id must be a number' })
      }
      const rows = await repos.listStudentSeats(pool, Number(request.params.id))
      response.json(rows.map((row) => ({ ...toEvent(row), status: row.status })))
    } catch (error) {
      next(error)
    }
  })

  // Everything below this line belongs to officers.
  //
  // The key lives in the server environment and travels in a header, so it
  // never reaches the built JavaScript the way a VITE_ value would. With no key
  // configured the guard refuses every officer route: a missing key locks the
  // door rather than leaving it open.
  const officerKey = process.env.OFFICER_KEY || ''

  function requireOfficer(request, response, next) {
    if (!officerKey) {
      return response.status(503).json({ error: 'This server has no officer key configured.' })
    }
    if (request.get('x-officer-key') !== officerKey) {
      return response.status(401).json({ error: 'That officer key is wrong.' })
    }
    next()
  }

  // An officer screen calls this once to find out whether the key it holds
  // works, before showing a dashboard it cannot use.
  app.get('/api/admin/session', requireOfficer, (request, response) => response.json({ ok: true }))

  app.post('/api/orgs/:orgId/events', requireOfficer, async (request, response, next) => {
    try {
      const orgs = await repos.listOrgs(pool)
      if (!orgs.some((org) => org.id === request.params.orgId)) {
        return response.status(404).json({ error: 'No such org' })
      }

      const { error, value } = validateEventInput(request.body)
      if (error) return response.status(400).json({ error })

      const row = await repos.createEvent(pool, { orgId: request.params.orgId, ...value })
      response.status(201).json(toEvent(row))
    } catch (caught) {
      next(caught)
    }
  })

  app.patch('/api/events/:id', requireOfficer, async (request, response, next) => {
    try {
      if (!isPositiveInteger(request.params.id)) {
        return response.status(400).json({ error: 'Event id must be a number' })
      }

      const { error, value } = validateEventInput(request.body, { partial: true })
      if (error) return response.status(400).json({ error })

      // Cutting the seat limit below the seats already held would leave an
      // event overbooked, which no later request could undo.
      const current = await repos.getEvent(pool, Number(request.params.id))
      if (!current) return response.status(404).json({ error: 'Event not found' })
      if (value.capacity !== undefined && value.capacity < current.seats_taken) {
        return response.status(409).json({
          error: `${current.seats_taken} seats are already held. Reject some requests before lowering the limit.`,
        })
      }

      const row = await repos.updateEvent(pool, Number(request.params.id), value)
      if (!row) return response.status(404).json({ error: 'Event not found' })
      response.json(toEvent(row))
    } catch (caught) {
      next(caught)
    }
  })

  app.delete('/api/events/:id', requireOfficer, async (request, response, next) => {
    try {
      if (!isPositiveInteger(request.params.id)) {
        return response.status(400).json({ error: 'Event id must be a number' })
      }
      const removed = await repos.deleteEvent(pool, Number(request.params.id))
      if (!removed) return response.status(404).json({ error: 'Event not found' })
      response.status(204).end()
    } catch (caught) {
      next(caught)
    }
  })

  // The list an officer reads at the door.
  app.get('/api/events/:id/attendees', requireOfficer, async (request, response, next) => {
    try {
      if (!isPositiveInteger(request.params.id)) {
        return response.status(400).json({ error: 'Event id must be a number' })
      }
      const rows = await repos.listAttendees(pool, Number(request.params.id))
      response.json(rows.map(toAttendee))
    } catch (caught) {
      next(caught)
    }
  })

  // Which events students wanted most, answered or not.
  app.get('/api/admin/report', requireOfficer, async (request, response, next) => {
    try {
      const limit = isPositiveInteger(request.query.limit) ? Math.min(Number(request.query.limit), 50) : 10
      response.json((await repos.topEvents(pool, limit)).map(toReportRow))
    } catch (caught) {
      next(caught)
    }
  })

  // The officer queue.
  app.get('/api/admin/requests', requireOfficer, async (request, response, next) => {
    try {
      const status = ['pending', 'approved', 'rejected'].includes(request.query.status)
        ? request.query.status
        : 'pending'
      response.json((await repos.listRequests(pool, status)).map(toRequest))
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/admin/requests/:id/:decision', requireOfficer, async (request, response, next) => {
    try {
      const { id, decision } = request.params
      if (!isPositiveInteger(id)) {
        return response.status(400).json({ error: 'Request id must be a number' })
      }
      if (decision !== 'approve' && decision !== 'reject') {
        return response.status(400).json({ error: 'Decision must be approve or reject' })
      }

      const saved = await repos.decideRequest(pool, {
        reservationId: Number(id),
        status: decision === 'approve' ? 'approved' : 'rejected',
      })
      if (!saved) return response.status(404).json({ error: 'No pending request with that id' })

      response.json({
        id: String(saved.id),
        eventId: String(saved.event_id),
        studentId: String(saved.student_id),
        status: saved.status,
        decidedAt: saved.decided_at,
      })
    } catch (error) {
      next(error)
    }
  })

  app.use((request, response) => response.status(404).json({ error: 'No such route' }))

  // The detail goes to the logs; the visitor gets a plain message, because a
  // stack trace tells a stranger about the file layout and the dependencies.
  app.use((error, request, response, next) => {
    console.error(error)
    response.status(500).json({ error: 'Something went wrong on the server' })
  })

  return app
}
