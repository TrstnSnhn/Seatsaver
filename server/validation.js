// Input checks shared by the routes. The database repeats the email rule as a
// CHECK constraint, because a client can be bypassed and a route can be missed.

export const HAU_STUDENT_DOMAIN = '@student.hau.edu.ph'

const EMAIL_PATTERN = /^[a-z0-9][a-z0-9._%+-]*@student\.hau\.edu\.ph$/

// Returns the normalised address, or null when it is not an HAU student address.
export function normaliseStudentEmail(value) {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  return EMAIL_PATTERN.test(email) ? email : null
}

export function isPositiveInteger(value) {
  return /^\d+$/.test(String(value)) && Number(value) > 0
}

export const RESERVATION_HOLD_STATUSES = ['pending', 'approved']

export const MAX_CAPACITY = 2000
const MAX_TITLE = 120
const MAX_VENUE = 120
const MAX_DESCRIPTION = 2000

const text = (value) => (typeof value === 'string' ? value.trim() : '')

// Checks the body an officer sends when creating or editing an event. Returns
// { error } with one message, or { value } with the cleaned fields.
//
// `partial` is true for a PATCH: only the fields that arrived are checked, and
// the rest keep the values already in the database.
export function validateEventInput(body, { partial = false } = {}) {
  const given = (field) => partial === false || body?.[field] !== undefined
  const value = {}

  if (given('title')) {
    const title = text(body?.title)
    if (!title) return { error: 'Give the event a title' }
    if (title.length > MAX_TITLE) return { error: `Keep the title under ${MAX_TITLE} characters` }
    value.title = title
  }

  if (given('venue')) {
    const venue = text(body?.venue)
    if (!venue) return { error: 'Say where the event happens' }
    if (venue.length > MAX_VENUE) return { error: `Keep the venue under ${MAX_VENUE} characters` }
    value.venue = venue
  }

  if (given('startsAt')) {
    const startsAt = new Date(text(body?.startsAt))
    if (Number.isNaN(startsAt.getTime())) return { error: 'Give a date and time for the event' }
    value.startsAt = startsAt.toISOString()
  }

  if (given('capacity')) {
    const capacity = Number(body?.capacity)
    if (!Number.isInteger(capacity) || capacity < 1) return { error: 'Seats must be a whole number, at least 1' }
    if (capacity > MAX_CAPACITY) return { error: `A venue holds at most ${MAX_CAPACITY} seats` }
    value.capacity = capacity
  }

  if (given('description')) {
    const description = text(body?.description)
    if (description.length > MAX_DESCRIPTION) {
      return { error: `Keep the description under ${MAX_DESCRIPTION} characters` }
    }
    value.description = description
  }

  if (Object.keys(value).length === 0) return { error: 'Nothing to change' }
  return { value }
}
