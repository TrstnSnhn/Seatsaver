// The real client. Every function here talks to the Express API.
//
// mockApi.js mirrors it for demo mode. Both files export the same functions
// with the same return shapes.

import { ApiError } from './rules.js'
import { readOfficerKey } from './officerKey.js'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

// Every officer route reads this header. Student routes ignore it, so sending
// it everywhere costs nothing and keeps one request function.
async function request(path, options) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-officer-key': readOfficerKey(),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    // Use the API's own message when it sends one; fall back to the status line.
    let message = `${response.status} ${response.statusText}`
    try {
      const body = await response.json()
      if (body?.error) message = body.error
    } catch {
      // The body was not JSON. The status line is all we have.
    }
    throw new ApiError(message, response.status)
  }

  return response.status === 204 ? null : response.json()
}

export const listOrgs = () => request('/api/orgs')

export const listStudents = () => request('/api/students')

export function listEvents({ orgId = '', from = '', to = '', q = '' } = {}) {
  const params = new URLSearchParams()
  if (orgId) params.set('org', orgId)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  if (q.trim()) params.set('q', q.trim())
  const query = params.toString()
  return request(`/api/events${query ? `?${query}` : ''}`)
}

export const getEvent = (id) => request(`/api/events/${encodeURIComponent(id)}`)

// The API checks the address against the HAU domain and the student roster
// before it holds a seat, so the email travels with the request.
export const requestSeat = (eventId, email) =>
  request(`/api/events/${encodeURIComponent(eventId)}/rsvps`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

export const cancelSeat = (eventId, studentId) =>
  request(`/api/events/${encodeURIComponent(eventId)}/rsvps/${encodeURIComponent(studentId)}`, {
    method: 'DELETE',
  })

export const listStudentSeats = (studentId) =>
  request(`/api/students/${encodeURIComponent(studentId)}/rsvps`)

export const listRequests = (status = 'pending') =>
  request(`/api/admin/requests?status=${encodeURIComponent(status)}`)

export const decideRequest = (requestId, decision) =>
  request(`/api/admin/requests/${encodeURIComponent(requestId)}/${decision}`, { method: 'POST' })

// Officer routes. The key travels in the header that `request` adds.

export const checkOfficerKey = () => request('/api/admin/session')

export const createEvent = (orgId, fields) =>
  request(`/api/orgs/${encodeURIComponent(orgId)}/events`, {
    method: 'POST',
    body: JSON.stringify(fields),
  })

export const updateEvent = (eventId, fields) =>
  request(`/api/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  })

export const deleteEvent = (eventId) =>
  request(`/api/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' })

export const listAttendees = (eventId) =>
  request(`/api/events/${encodeURIComponent(eventId)}/attendees`)

export const listReport = (limit = 10) => request(`/api/admin/report?limit=${limit}`)
