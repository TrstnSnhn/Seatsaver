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
