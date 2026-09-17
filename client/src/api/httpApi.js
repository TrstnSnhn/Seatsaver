// The real client. Every function here talks to the Express API.
//
// mockApi.js exists so the interface can ship before the API is deployed. Both
// files export the same functions with the same return shapes.

import { ApiError } from './rules.js'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

async function request(path, options) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
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

export const reserveSeat = (eventId, studentId) =>
  request(`/api/events/${encodeURIComponent(eventId)}/rsvps`, {
    method: 'POST',
    body: JSON.stringify({ studentId }),
  })

export const cancelSeat = (eventId, studentId) =>
  request(`/api/events/${encodeURIComponent(eventId)}/rsvps/${encodeURIComponent(studentId)}`, {
    method: 'DELETE',
  })

export const listStudentSeats = (studentId) =>
  request(`/api/students/${encodeURIComponent(studentId)}/rsvps`)
