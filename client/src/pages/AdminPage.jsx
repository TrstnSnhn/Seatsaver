import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { decideRequest, listRequests, seatsLeft } from '../api'
import Button from '../components/Button.jsx'
import OfficerGate from '../components/OfficerGate.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { EmptyState, StatusMessage } from '../components/StatusMessage.jsx'
import { longDate, timeOf } from '../format.js'
import styles from './Admin.module.css'
import page from './Page.module.css'

const TABS = [
  { status: 'pending', label: 'Waiting' },
  { status: 'approved', label: 'Approved' },
  { status: 'rejected', label: 'Rejected' },
]

const EMPTY_HINTS = {
  pending: 'Every request has an answer. Nothing is waiting on you.',
  approved: 'No approved requests yet.',
  rejected: 'No rejected requests yet.',
}

export default function AdminPage() {
  return (
    <OfficerGate title="Requests">
      <Queue />
    </OfficerGate>
  )
}

function Queue() {
  const [tab, setTab] = useState('pending')
  const [requests, setRequests] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [decidingId, setDecidingId] = useState(null)
  const [message, setMessage] = useState(null) // { kind, text }

  useEffect(() => {
    let active = true
    setStatus('loading')
    listRequests(tab)
      .then((list) => {
        if (!active) return
        setRequests(list)
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
  }, [tab, attempt])

  async function decide(request, decision) {
    setDecidingId(request.id)
    setMessage(null)
    try {
      await decideRequest(request.id, decision)
      setRequests((current) => current.filter((row) => row.id !== request.id))
      const verb = decision === 'approve' ? 'approved' : 'rejected'
      setMessage({
        kind: 'success',
        text: `Request from ${request.studentName} for ${request.eventTitle} is ${verb}.`,
      })
    } catch (caught) {
      setMessage({ kind: 'error', text: caught.message })
      setAttempt((count) => count + 1) // someone else may have answered it first
    } finally {
      setDecidingId(null)
    }
  }

  return (
    <>
      <div className={page.head}>
        <h1 className={page.title}>Requests</h1>
        <p className={page.subtitle}>
          Every seat starts as a request. Approve it to hold the seat, or reject it to free the seat
          for someone else.
        </p>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Request status">
        {TABS.map((item) => (
          <button
            key={item.status}
            type="button"
            role="tab"
            aria-selected={tab === item.status}
            className={`${styles.tab} ${tab === item.status ? styles.tabOn : ''}`}
            onClick={() => setTab(item.status)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {message && <StatusMessage kind={message.kind}>{message.text}</StatusMessage>}

      {status === 'loading' && <StatusMessage kind="loading">Loading requests</StatusMessage>}

      {status === 'error' && (
        <div className={page.stack}>
          <StatusMessage kind="error">Could not load requests: {error?.message}</StatusMessage>
          <div>
            <Button variant="ghost" onClick={() => setAttempt((count) => count + 1)}>Try again</Button>
          </div>
        </div>
      )}

      {status === 'ready' && requests.length === 0 && (
        <EmptyState title="Nothing here" hint={EMPTY_HINTS[tab]} />
      )}

      {status === 'ready' && requests.length > 0 && (
        <ul className={styles.list}>
          {requests.map((request) => (
            <li key={request.id} className={styles.row}>
              <div className={styles.who}>
                <p className={styles.name}>{request.studentName}</p>
                <p className={styles.detail}>{request.studentEmail}</p>
                <p className={styles.detail}>Student no. {request.studentNo}</p>
              </div>

              <div className={styles.what}>
                <h2 className={styles.event}>
                  <Link to={`/events/${request.eventId}`}>{request.eventTitle}</Link>
                </h2>
                <p className={styles.detail}>
                  <time dateTime={request.eventStartsAt}>
                    {longDate(request.eventStartsAt)}, {timeOf(request.eventStartsAt)}
                  </time>
                </p>
                <p className={styles.detail}>{request.eventVenue}</p>
                <p className={styles.seats}>
                  {request.seatsTaken} of {request.capacity} held,
                  {' '}
                  {seatsLeft(request.capacity, request.seatsTaken)} open
                </p>
              </div>

              <div className={styles.decide}>
                {request.status === 'pending' ? (
                  <>
                    <Button
                      size="small"
                      onClick={() => decide(request, 'approve')}
                      disabled={decidingId === request.id}
                      aria-label={`Approve ${request.studentName} for ${request.eventTitle}`}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      className={styles.reject}
                      onClick={() => decide(request, 'reject')}
                      disabled={decidingId === request.id}
                      aria-label={`Reject ${request.studentName} for ${request.eventTitle}`}
                    >
                      Reject
                    </Button>
                  </>
                ) : (
                  <StatusBadge status={request.status} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
