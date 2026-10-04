// The only file the screens import from.
//
// Swapping the simulated backend for the real API is one environment variable,
// set at BUILD time. Nothing in src/pages or src/components changes.
//
//   VITE_USE_MOCK_API=false          -> the Express API at VITE_API_BASE_URL
//   anything else, INCLUDING UNSET   -> the browser-only simulation
//
// Demo mode is the default, so a fresh build works before anything is
// configured, and a forgotten variable shows a visible notice rather than a
// silently broken site.

import * as mockApi from './mockApi.js'
import * as httpApi from './httpApi.js'

export const USING_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'

const implementation = USING_MOCK_API ? mockApi : httpApi

export const {
  listOrgs,
  listStudents,
  listEvents,
  getEvent,
  requestSeat,
  cancelSeat,
  listStudentSeats,
  listRequests,
  decideRequest,
  checkOfficerKey,
  createEvent,
  updateEvent,
  deleteEvent,
  listAttendees,
  listReport,
} = implementation

export { seatsLeft, normaliseStudentEmail, STATUS_LABELS, HAU_STUDENT_DOMAIN } from './rules.js'
export { readOfficerKey, writeOfficerKey } from './officerKey.js'
