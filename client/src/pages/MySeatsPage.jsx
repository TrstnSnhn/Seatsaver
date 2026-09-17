import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cancelSeat, listStudentSeats } from '../api'
import Button from '../components/Button.jsx'
import EventCard from '../components/EventCard.jsx'
import { EmptyState, StatusMessage } from '../components/StatusMessage.jsx'
import { useStudent } from '../context/StudentContext.jsx'
import styles from './Page.module.css'

export default function MySeatsPage() {
  const { student } = useStudent()
  const [seats, setSeats] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [cancellingId, setCancellingId] = useState(null)
  const [message, setMessage] = useState(null) // { kind, text }

  useEffect(() => {
    if (!student) return
    let active = true
    setStatus('loading')
    setMessage(null)
    listStudentSeats(student.id)
      .then((list) => {
        if (!active) return
        setSeats(list)
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
  }, [student, attempt])

  async function handleCancel(event) {
    setCancellingId(event.id)
    setMessage(null)
    try {
      await cancelSeat(event.id, student.id)
      setSeats((current) => current.filter((seat) => seat.id !== event.id))
      setMessage({ kind: 'success', text: `Seat cancelled for ${event.title}.` })
    } catch (caught) {
      setMessage({ kind: 'error', text: caught.message })
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>My seats</h1>
        <p className={styles.subtitle}>
          {student ? `Events ${student.name} holds a seat for, soonest first.` : 'Loading student'}
        </p>
      </div>

      {message && <StatusMessage kind={message.kind}>{message.text}</StatusMessage>}

      {status === 'loading' && <StatusMessage kind="loading">Loading your seats</StatusMessage>}

      {status === 'error' && (
        <div className={styles.stack}>
          <StatusMessage kind="error">Could not load your seats: {error?.message}</StatusMessage>
          <div>
            <Button variant="ghost" onClick={() => setAttempt((count) => count + 1)}>Try again</Button>
          </div>
        </div>
      )}

      {status === 'ready' && seats.length === 0 && (
        <EmptyState
          title="No seats yet"
          hint="Browse events and tap Save my seat."
          action={<Button as={Link} to="/" variant="ghost">Browse events</Button>}
        />
      )}

      {status === 'ready' && seats.length > 0 && (
        <div className={styles.grid}>
          {seats.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              mine
              action={
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => handleCancel(event)}
                  disabled={cancellingId === event.id}
                  aria-label={`Cancel seat for ${event.title}`}
                >
                  {cancellingId === event.id ? 'Cancelling' : 'Cancel'}
                </Button>
              }
            />
          ))}
        </div>
      )}
    </>
  )
}
