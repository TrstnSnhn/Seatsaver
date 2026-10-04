import { useEffect, useState } from 'react'
import {
  createEvent,
  deleteEvent,
  listAttendees,
  listEvents,
  listOrgs,
  listReport,
  seatsLeft,
  updateEvent,
} from '../api'
import Button from '../components/Button.jsx'
import EventForm from '../components/EventForm.jsx'
import OfficerGate from '../components/OfficerGate.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { EmptyState, StatusMessage } from '../components/StatusMessage.jsx'
import { longDate, timeOf } from '../format.js'
import styles from './Manage.module.css'
import page from './Page.module.css'

export default function ManagePage() {
  return (
    <OfficerGate title="Manage events">
      <Dashboard />
    </OfficerGate>
  )
}

function Dashboard() {
  const [orgs, setOrgs] = useState([])
  const [events, setEvents] = useState([])
  const [report, setReport] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState(null) // { kind, text }

  const reload = () => setAttempt((count) => count + 1)

  useEffect(() => {
    let active = true
    setStatus('loading')
    Promise.all([listOrgs(), listEvents(), listReport(10)])
      .then(([orgRows, eventRows, reportRows]) => {
        if (!active) return
        setOrgs(orgRows)
        setEvents(eventRows)
        setReport(reportRows)
        setStatus('ready')
      })
      .catch((caught) => {
        if (!active) return
        setError(caught)
        setStatus('error')
      })
    return () => {
      active = false
    }
  }, [attempt])

  async function handleCreate({ orgId, ...fields }) {
    const created = await createEvent(orgId, fields)
    setMessage({ kind: 'success', text: `${created.title} is posted. Students can request a seat now.` })
    reload()
  }

  async function handleEdit(event, { orgId, ...fields }) {
    await updateEvent(event.id, fields)
    setEditingId(null)
    setMessage({ kind: 'success', text: `${fields.title} is updated.` })
    reload()
  }

  // Deleting takes the reservations with it, so the count goes in the question.
  async function handleDelete(event) {
    const held = event.seatsTaken
    const warning = held > 0
      ? `Delete ${event.title}? ${held} students hold a seat and will lose it.`
      : `Delete ${event.title}?`
    if (!window.confirm(warning)) return

    setBusyId(event.id)
    setMessage(null)
    try {
      await deleteEvent(event.id)
      setMessage({ kind: 'success', text: `${event.title} is deleted.` })
      reload()
    } catch (caught) {
      setMessage({ kind: 'error', text: caught.message })
    } finally {
      setBusyId(null)
    }
  }

  if (status === 'loading') return <StatusMessage kind="loading">Loading the dashboard</StatusMessage>

  if (status === 'error') {
    return (
      <div className={page.stack}>
        <StatusMessage kind="error">Could not load the dashboard: {error?.message}</StatusMessage>
        <div><Button variant="ghost" onClick={reload}>Try again</Button></div>
      </div>
    )
  }

  return (
    <>
      <div className={page.head}>
        <h1 className={page.title}>Manage events</h1>
        <p className={page.subtitle}>
          Post an event, edit the details, or take it down. Seats students already hold travel with
          the event, so deleting one cancels their seats.
        </p>
      </div>

      {message && <StatusMessage kind={message.kind}>{message.text}</StatusMessage>}

      <h2 className={styles.section}>Post a new event</h2>
      <EventForm orgs={orgs} onSubmit={handleCreate} />

      <h2 className={styles.section}>Your events</h2>
      {events.length === 0 ? (
        <EmptyState title="No events yet" hint="Post the first one with the form above." />
      ) : (
        <ul className={styles.list}>
          {events.map((event) =>
            editingId === event.id ? (
              <li key={event.id} className={styles.editing}>
                <EventForm
                  orgs={orgs}
                  event={event}
                  onSubmit={(fields) => handleEdit(event, fields)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <EventRow
                key={event.id}
                event={event}
                isBusy={busyId === event.id}
                onEdit={() => setEditingId(event.id)}
                onDelete={() => handleDelete(event)}
              />
            )
          )}
        </ul>
      )}

      <h2 className={styles.section}>Most requested</h2>
      <p className={page.subtitle}>
        Every request counts here, approved or not, because the question is which events students
        wanted rather than which ones officers answered.
      </p>
      <div className={styles.scroller}>
      <table className={styles.report}>
        <thead>
          <tr>
            <th>Event</th>
            <th>Org</th>
            <th className={styles.number}>Requests</th>
            <th className={styles.number}>Held</th>
            <th className={styles.number}>Rejected</th>
          </tr>
        </thead>
        <tbody>
          {report.map((row) => (
            <tr key={row.id}>
              <td className={styles.rowTitle}>{row.title}</td>
              <td>{row.orgName}</td>
              <td className={styles.number}>{row.requests}</td>
              <td className={styles.number}>{row.seatsTaken} / {row.capacity}</td>
              <td className={styles.number}>{row.rejected}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  )
}

function EventRow({ event, isBusy, onEdit, onDelete }) {
  const [attendees, setAttendees] = useState(null)
  const [isOpening, setIsOpening] = useState(false)
  const [listError, setListError] = useState(null)

  async function toggleAttendees() {
    if (attendees) return setAttendees(null)
    setIsOpening(true)
    setListError(null)
    try {
      setAttendees(await listAttendees(event.id))
    } catch (caught) {
      setListError(caught)
    } finally {
      setIsOpening(false)
    }
  }

  return (
    <li className={styles.row}>
      <div className={styles.what}>
        <span className={styles.tag}>{event.orgName}</span>
        <h3 className={styles.rowTitle}>{event.title}</h3>
        <p className={styles.detail}>
          <time dateTime={event.startsAt}>{longDate(event.startsAt)}, {timeOf(event.startsAt)}</time>
        </p>
        <p className={styles.detail}>{event.venue}</p>
        <p className={styles.seats}>
          {event.seatsTaken} of {event.capacity} held, {seatsLeft(event.capacity, event.seatsTaken)} open
        </p>
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" size="small" onClick={onEdit}>Edit</Button>
        <Button variant="ghost" size="small" onClick={toggleAttendees} disabled={isOpening}>
          {attendees ? 'Hide list' : isOpening ? 'Opening' : 'Who is coming'}
        </Button>
        <Button
          variant="danger"
          size="small"
          className={styles.delete}
          onClick={onDelete}
          disabled={isBusy}
          aria-label={`Delete ${event.title}`}
        >
          {isBusy ? 'Deleting' : 'Delete'}
        </Button>
      </div>

      {listError && <StatusMessage kind="error">{listError.message}</StatusMessage>}

      {attendees && (
        <ol className={styles.attendees}>
          {attendees.length === 0 && <li className={styles.detail}>Nobody holds a seat yet.</li>}
          {attendees.map((attendee) => (
            <li key={attendee.id} className={styles.attendee}>
              <span className={styles.attendeeName}>{attendee.name}</span>
              <span className={styles.detail}>{attendee.studentNo}</span>
              <StatusBadge status={attendee.status} />
            </li>
          ))}
        </ol>
      )}
    </li>
  )
}
