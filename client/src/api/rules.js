// The reservation rules, in one place. The simulated backend uses them, and the
// Express API enforces the same rules in PostgreSQL.

// A pending or an approved reservation holds a seat. A rejected one frees it.
export const HOLD_STATUSES = ['pending', 'approved']

export const HAU_STUDENT_DOMAIN = '@student.hau.edu.ph'

const EMAIL_PATTERN = /^[a-z0-9][a-z0-9._%+-]*@student\.hau\.edu\.ph$/

// Returns the normalised address, or null when it is not an HAU student address.
export function normaliseStudentEmail(value) {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  return EMAIL_PATTERN.test(email) ? email : null
}

export function seatsLeft(capacity, seatsTaken) {
  return Math.max(capacity - seatsTaken, 0)
}

// Returns null when the student may reserve, or the reason they may not.
export function reservationProblem({ capacity, seatsTaken, alreadyHolds }) {
  if (alreadyHolds) return 'duplicate'
  if (seatsTaken >= capacity) return 'full'
  return null
}

export const PROBLEM_MESSAGES = {
  duplicate: 'You already have a request for this event.',
  full: 'This event is full.',
  domain: `Use your HAU student address, ending in ${HAU_STUDENT_DOMAIN}`,
  roster: 'That address is not on the student roster. Ask your org officer to add you.',
}

export const STATUS_LABELS = {
  pending: 'Waiting for approval',
  approved: 'Seat approved',
  rejected: 'Request rejected',
}

// Both API implementations throw this, so pages can read error.status the same
// way whether the backend is simulated or real.
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}
