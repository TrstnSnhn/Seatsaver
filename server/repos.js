// The data-access layer. Routes handle HTTP; every SQL statement lives here,
// and every value goes in through a parameter, never into the string.

import { RESERVATION_HOLD_STATUSES } from './validation.js'

const HOLD = RESERVATION_HOLD_STATUSES // pending and approved both hold a seat

// One event row with its org and the number of seats held.
const EVENT_SELECT = `
  SELECT
    e.id,
    e.org_id,
    e.title,
    e.venue,
    e.starts_at,
    e.capacity,
    e.description,
    o.name       AS org_name,
    o.short_name AS org_short_name,
    (
      SELECT count(*)::int
      FROM reservations r
      WHERE r.event_id = e.id AND r.status = ANY ($1)
    ) AS seats_taken
  FROM events e
  JOIN orgs o ON o.id = e.org_id
`

export async function listOrgs(pool) {
  const result = await pool.query('SELECT id, name, short_name FROM orgs ORDER BY name')
  return result.rows
}

export async function listStudents(pool) {
  const result = await pool.query(
    `SELECT id, name, email, student_no, is_admin
     FROM students
     WHERE student_no LIKE '2024%' OR is_admin
     ORDER BY is_admin, name`
  )
  return result.rows
}

export async function findStudentByEmail(pool, email) {
  const result = await pool.query(
    'SELECT id, name, email, student_no, is_admin FROM students WHERE email = $1',
    [email]
  )
  return result.rows[0] ?? null
}

export async function listEvents(pool, { orgId = '', from = '', to = '', q = '' } = {}) {
  const values = [HOLD]
  const where = []

  if (orgId) {
    values.push(orgId)
    where.push(`e.org_id = $${values.length}`)
  }
  if (from) {
    values.push(from)
    where.push(`(e.starts_at AT TIME ZONE 'Asia/Manila')::date >= $${values.length}::date`)
  }
  if (to) {
    values.push(to)
    where.push(`(e.starts_at AT TIME ZONE 'Asia/Manila')::date <= $${values.length}::date`)
  }
  if (q.trim()) {
    values.push(`%${q.trim()}%`)
    where.push(`e.title ILIKE $${values.length}`)
  }

  const result = await pool.query(
    `${EVENT_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY e.starts_at`,
    values
  )
  return result.rows
}

export async function getEvent(pool, id) {
  const result = await pool.query(`${EVENT_SELECT} WHERE e.id = $2`, [HOLD, id])
  return result.rows[0] ?? null
}

// The seat limit, enforced where it cannot be bypassed.
//
// SELECT ... FOR UPDATE locks the event row for the length of the transaction,
// so two requests for the last seat take turns: the second one counts the seat
// the first one just took and gets 'full' back.
export async function requestSeat(pool, { eventId, studentId }) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const event = await client.query('SELECT id, capacity FROM events WHERE id = $1 FOR UPDATE', [eventId])
    if (event.rowCount === 0) {
      await client.query('ROLLBACK')
      return { problem: 'not_found' }
    }

    const existing = await client.query(
      'SELECT id, status FROM reservations WHERE event_id = $1 AND student_id = $2',
      [eventId, studentId]
    )
    if (existing.rowCount > 0 && existing.rows[0].status !== 'rejected') {
      await client.query('ROLLBACK')
      return { problem: 'duplicate' }
    }

    const held = await client.query(
      'SELECT count(*)::int AS taken FROM reservations WHERE event_id = $1 AND status = ANY ($2)',
      [eventId, HOLD]
    )
    if (held.rows[0].taken >= event.rows[0].capacity) {
      await client.query('ROLLBACK')
      return { problem: 'full' }
    }

    // A student whose earlier request was rejected may ask again.
    const saved = existing.rowCount > 0
      ? await client.query(
          `UPDATE reservations
           SET status = 'pending', requested_at = now(), decided_at = NULL
           WHERE id = $1
           RETURNING id, event_id, student_id, status, requested_at`,
          [existing.rows[0].id]
        )
      : await client.query(
          `INSERT INTO reservations (event_id, student_id)
           VALUES ($1, $2)
           RETURNING id, event_id, student_id, status, requested_at`,
          [eventId, studentId]
        )

    await client.query('COMMIT')
    return { reservation: saved.rows[0] }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function cancelSeat(pool, { eventId, studentId }) {
  const result = await pool.query(
    `DELETE FROM reservations
     WHERE event_id = $1 AND student_id = $2 AND status = ANY ($3)
     RETURNING id`,
    [eventId, studentId, HOLD]
  )
  return result.rowCount > 0
}

export async function listStudentSeats(pool, studentId) {
  // The event row carries the student's own status, so My seats can show
  // whether an officer has answered the request.
  const result = await pool.query(
    `SELECT ev.*, r2.status, r2.requested_at
     FROM (${EVENT_SELECT}) ev
     JOIN reservations r2 ON r2.event_id = ev.id AND r2.student_id = $2
     WHERE r2.status = ANY ($1)
     ORDER BY ev.starts_at`,
    [HOLD, studentId]
  )
  return result.rows
}

// Everything the officer queue needs: who asked, for which event, and when.
export async function listRequests(pool, status = 'pending') {
  const result = await pool.query(
    `SELECT
       r.id,
       r.status,
       r.requested_at,
       r.decided_at,
       s.name       AS student_name,
       s.email      AS student_email,
       s.student_no AS student_no,
       e.id         AS event_id,
       e.title      AS event_title,
       e.venue      AS event_venue,
       e.starts_at  AS event_starts_at,
       e.capacity   AS event_capacity,
       (
         SELECT count(*)::int
         FROM reservations held
         WHERE held.event_id = e.id AND held.status = ANY ($2)
       ) AS seats_taken
     FROM reservations r
     JOIN students s ON s.id = r.student_id
     JOIN events e ON e.id = r.event_id
     WHERE r.status = $1
     ORDER BY r.requested_at`,
    [status, HOLD]
  )
  return result.rows
}

// The org dashboard. Officers own these five, and the guard in app.js is what
// keeps a stranger out of them.

export async function createEvent(pool, { orgId, title, venue, startsAt, capacity, description = '' }) {
  const result = await pool.query(
    `INSERT INTO events (org_id, title, venue, starts_at, capacity, description)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [orgId, title, venue, startsAt, capacity, description]
  )
  return getEvent(pool, result.rows[0].id)
}

const COLUMN_OF = {
  title: 'title',
  venue: 'venue',
  startsAt: 'starts_at',
  capacity: 'capacity',
  description: 'description',
}

// Only the fields the officer actually changed are written, so editing the
// venue cannot quietly overwrite the description with a stale copy.
export async function updateEvent(pool, id, fields) {
  const values = [id]
  const sets = Object.entries(fields)
    .filter(([key]) => COLUMN_OF[key])
    .map(([key, value]) => {
      values.push(value)
      return `${COLUMN_OF[key]} = $${values.length}`
    })

  if (sets.length === 0) return getEvent(pool, id)

  const updated = await pool.query(
    `UPDATE events SET ${sets.join(', ')} WHERE id = $1 RETURNING id`,
    values
  )
  return updated.rowCount === 0 ? null : getEvent(pool, id)
}

// The reservations go with it: the foreign key is ON DELETE CASCADE, so no row
// is left pointing at an event that no longer exists.
export async function deleteEvent(pool, id) {
  const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING id', [id])
  return result.rowCount > 0
}

// Who is coming, for the officer printing a list at the door.
export async function listAttendees(pool, eventId) {
  const result = await pool.query(
    `SELECT s.id, s.name, s.email, s.student_no, r.status, r.requested_at
     FROM reservations r
     JOIN students s ON s.id = r.student_id
     WHERE r.event_id = $1 AND r.status = ANY ($2)
     ORDER BY r.status, s.name`,
    [eventId, HOLD]
  )
  return result.rows
}

// The most-requested events: every request counts, answered or not, because the
// question is which events students wanted, not which ones officers approved.
export async function topEvents(pool, limit = 10) {
  const result = await pool.query(
    `SELECT
       e.id,
       e.title,
       e.venue,
       e.starts_at,
       e.capacity,
       o.name AS org_name,
       count(r.id)::int                                   AS requests,
       count(*) FILTER (WHERE r.status = ANY ($1))::int    AS seats_taken,
       count(*) FILTER (WHERE r.status = 'rejected')::int  AS rejected
     FROM events e
     JOIN orgs o ON o.id = e.org_id
     LEFT JOIN reservations r ON r.event_id = e.id
     GROUP BY e.id, o.name
     ORDER BY requests DESC, e.starts_at
     LIMIT $2`,
    [HOLD, limit]
  )
  return result.rows
}

export async function decideRequest(pool, { reservationId, status }) {
  const result = await pool.query(
    `UPDATE reservations
     SET status = $2, decided_at = now()
     WHERE id = $1 AND status = 'pending'
     RETURNING id, event_id, student_id, status, decided_at`,
    [reservationId, status]
  )
  return result.rows[0] ?? null
}
