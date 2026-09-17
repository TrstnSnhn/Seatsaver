import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listEvents, listOrgs } from '../api'
import Button from '../components/Button.jsx'
import EventCard from '../components/EventCard.jsx'
import FilterBar from '../components/FilterBar.jsx'
import { EmptyState, StatusMessage } from '../components/StatusMessage.jsx'
import styles from './Page.module.css'

const NO_FILTERS = { orgId: '', from: '', to: '', q: '' }

export default function EventsPage() {
  const [orgs, setOrgs] = useState([])
  const [filters, setFilters] = useState(NO_FILTERS)
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    listOrgs()
      .then((list) => active && setOrgs(list))
      .catch((caught) => active && setError(caught))
    return () => {
      active = false
    }
  }, [])

  // Refetch whenever a filter changes. The `active` flag drops a slow response
  // that arrives after a newer request, so the grid never shows stale results.
  useEffect(() => {
    let active = true
    setStatus('loading')
    listEvents(filters)
      .then((list) => {
        if (!active) return
        setEvents(list)
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
  }, [filters, attempt])

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Upcoming events at HAU</h1>
        <p className={styles.subtitle}>Pick an event and save your seat before it fills up.</p>
      </div>

      <FilterBar orgs={orgs} filters={filters} onChange={setFilters} onClear={() => setFilters(NO_FILTERS)} />

      {status === 'loading' && <StatusMessage kind="loading">Loading events</StatusMessage>}

      {status === 'error' && (
        <div className={styles.stack}>
          <StatusMessage kind="error">Could not load events: {error?.message}</StatusMessage>
          <div>
            <Button variant="ghost" onClick={() => setAttempt((count) => count + 1)}>Try again</Button>
          </div>
        </div>
      )}

      {status === 'ready' && events.length === 0 && (
        <EmptyState
          title="No events match"
          hint="Try another org, a wider date range, or a shorter search."
          action={<Button variant="ghost" onClick={() => setFilters(NO_FILTERS)}>Clear filters</Button>}
        />
      )}

      {status === 'ready' && events.length > 0 && (
        <div className={styles.grid}>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              action={
                <Button as={Link} to={`/events/${event.id}`} variant="ghost" size="small" aria-label={`View ${event.title}`}>
                  View
                </Button>
              }
            />
          ))}
        </div>
      )}
    </>
  )
}
