import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { HAU_STUDENT_DOMAIN, cancelSeat, getEvent, listStudentSeats, requestSeat, seatsLeft } from '../api'
import Button from '../components/Button.jsx'
import SeatMeter from '../components/SeatMeter.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { EmptyState, StatusMessage } from '../components/StatusMessage.jsx'
import { useStudent } from '../context/StudentContext.jsx'
import { longDate, timeOf } from '../format.js'
import styles from './Page.module.css'

export default function EventDetailPage() {
  const { id } = useParams()
  const { student } = useStudent()
  const [event, setEvent] = useState(null)
  const [seatStatus, setSeatStatus] = useState(null) // null, pending, or approved
  const [status, setStatus] = useState('loading') // loading | ready | notfound | error
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [email, setEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState(null) // { kind, text }

  // Load the event and the current student's seat, if they hold one. This
  // reruns when the visitor switches student in the header.
  useEffect(() => {
    if (!student) return
    let active = true
    setStatus('loading')
    setMessage(null)
    setEmail('')
    Promise.all([getEvent(id), listStudentSeats(student.id)])
      .then(([found, seats]) => {
        if (!active) return
        setEvent(found)
        setSeatStatus(seats.find((seat) => seat.id === found.id)?.status ?? null)
        setStatus('ready')
      })
      .catch((caught) => {
        if (!active) return
        if (caught.status === 404) {
          setStatus('notfound')
        } else {
          setError(caught)
          setStatus('error')
        }
      })
    return () => {
      active = false
    }
  }, [id, student, attempt])

  async function refreshCount() {
    try {
      setEvent(await getEvent(id))
    } catch {
      // The action's own message is already on screen; keep the last known count.
    }
  }

  // The address decides who the request belongs to. The API checks the HAU
  // domain and the roster again before it holds anything.
  async function handleRequest(submitEvent) {
    submitEvent.preventDefault()
    setIsSaving(true)
    setMessage(null)
    try {
      await requestSeat(event.id, email)
      setSeatStatus('pending')
      setEvent((current) => ({ ...current, seatsTaken: current.seatsTaken + 1 }))
      setMessage({
        kind: 'success',
        text: 'Request sent. The seat is held while an org officer reviews it.',
      })
    } catch (caught) {
      setMessage({ kind: 'error', text: caught.message })
      await refreshCount() // a 409 usually means the count moved since the page loaded
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCancel() {
    setIsSaving(true)
    setMessage(null)
    try {
      await cancelSeat(event.id, student.id)
      setSeatStatus(null)
      setEvent((current) => ({ ...current, seatsTaken: current.seatsTaken - 1 }))
      setMessage({ kind: 'success', text: 'Seat cancelled. Someone else can take it now.' })
    } catch (caught) {
      setMessage({ kind: 'error', text: caught.message })
      await refreshCount()
    } finally {
      setIsSaving(false)
    }
  }

  const backLink = <Link to="/" className={styles.back}>Back to events</Link>

  if (status === 'loading') {
    return (
      <>
        {backLink}
        <StatusMessage kind="loading">Loading event</StatusMessage>
      </>
    )
  }

  if (status === 'notfound') {
    return (
      <EmptyState
        title="Event not found"
        hint="It may have been deleted, or the link is wrong."
        action={<Button as={Link} to="/" variant="ghost">Back to events</Button>}
      />
    )
  }

  if (status === 'error') {
    return (
      <div className={styles.stack}>
        {backLink}
        <StatusMessage kind="error">Could not load this event: {error?.message}</StatusMessage>
        <div>
          <Button variant="ghost" onClick={() => setAttempt((count) => count + 1)}>Try again</Button>
        </div>
      </div>
    )
  }

  const isFull = seatsLeft(event.capacity, event.seatsTaken) === 0

  return (
    <>
      {backLink}
      <div className={styles.detail}>
        <article>
          <span className={styles.tag}>{event.orgName}</span>
          <h1 className={styles.title} style={{ marginTop: 'var(--space-1)' }}>{event.title}</h1>
          <dl className={styles.facts}>
            <dt>When</dt>
            <dd><time dateTime={event.startsAt}>{longDate(event.startsAt)}, {timeOf(event.startsAt)}</time></dd>
            <dt>Where</dt>
            <dd>{event.venue}</dd>
          </dl>
          <p className={styles.description}>{event.description}</p>
        </article>

        <aside className={styles.panel} aria-labelledby="seat-panel-title">
          <h2 id="seat-panel-title" className={styles.panelTitle}>Seats</h2>
          <SeatMeter taken={event.seatsTaken} capacity={event.capacity} mine={Boolean(seatStatus)} />

          {seatStatus ? (
            <>
              <StatusBadge status={seatStatus} />
              <Button variant="danger" onClick={handleCancel} disabled={isSaving}>
                {isSaving ? 'Cancelling' : 'Cancel my seat'}
              </Button>
            </>
          ) : (
            <form className={styles.form} onSubmit={handleRequest}>
              <label className={styles.label} htmlFor="student-email">HAU student email</label>
              <input
                id="student-email"
                className={styles.input}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                disabled={isFull}
                placeholder={`juan.cruz${HAU_STUDENT_DOMAIN}`}
                value={email}
                onChange={(field) => setEmail(field.target.value)}
                aria-describedby="student-email-hint"
              />
              <p id="student-email-hint" className={styles.hint}>
                Seats are for HAU students. Only an address ending in {HAU_STUDENT_DOMAIN} that is on
                the roster can request a seat.
              </p>
              <Button type="submit" variant="primary" disabled={isSaving || isFull}>
                {isFull ? 'Event full' : isSaving ? 'Sending' : 'Request a seat'}
              </Button>
            </form>
          )}

          {message && <StatusMessage kind={message.kind}>{message.text}</StatusMessage>}
        </aside>
      </div>
    </>
  )
}
