// The two reservation rules, in one place. The simulated backend uses them now;
// the Express API enforces the same rules in PostgreSQL later.

export function seatsLeft(capacity, seatsTaken) {
  return Math.max(capacity - seatsTaken, 0)
}

// Returns null when the student may reserve, or the reason they may not.
export function reservationProblem({ capacity, seatsTaken, alreadyReserved }) {
  if (alreadyReserved) return 'duplicate'
  if (seatsTaken >= capacity) return 'full'
  return null
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

export const PROBLEM_MESSAGES = {
  duplicate: 'You already hold a seat for this event.',
  full: 'This event is full.',
}
