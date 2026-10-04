import { useState } from 'react'
import Button from './Button.jsx'
import { StatusMessage } from './StatusMessage.jsx'
import { isoFromManilaInput, manilaInputValue } from '../format.js'
import styles from './EventForm.module.css'

const BLANK = { title: '', venue: '', startsAt: '', capacity: 30, description: '' }

// One form for both jobs. `event` is null when an officer is posting a new one,
// and the existing event when they are editing it.
export default function EventForm({ orgs, event = null, onSubmit, onCancel }) {
  const [fields, setFields] = useState(() =>
    event
      ? {
          title: event.title,
          venue: event.venue,
          startsAt: manilaInputValue(event.startsAt),
          capacity: event.capacity,
          description: event.description ?? '',
        }
      : BLANK
  )
  const [orgId, setOrgId] = useState(() => event?.orgId ?? orgs[0]?.id ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (name) => (input) => setFields((current) => ({ ...current, [name]: input.target.value }))

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault()
    setIsSaving(true)
    setError(null)
    try {
      await onSubmit({
        orgId,
        title: fields.title,
        venue: fields.venue,
        startsAt: isoFromManilaInput(fields.startsAt),
        capacity: Number(fields.capacity),
        description: fields.description,
      })
      if (!event) setFields(BLANK) // a fresh form, ready for the next event
    } catch (caught) {
      setError(caught)
    } finally {
      setIsSaving(false)
    }
  }

  const id = (name) => `${event ? `edit-${event.id}` : 'new'}-${name}`

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <label className={styles.field} htmlFor={id('title')}>
          <span className={styles.label}>Title</span>
          <input className={styles.input} id={id('title')} required maxLength={120} value={fields.title} onChange={set('title')} />
        </label>
        <label className={styles.field} htmlFor={id('org')}>
          <span className={styles.label}>Org</span>
          <select
            className={styles.input}
            id={id('org')}
            value={orgId}
            disabled={Boolean(event)}
            onChange={(input) => setOrgId(input.target.value)}
          >
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.row}>
        <label className={styles.field} htmlFor={id('venue')}>
          <span className={styles.label}>Venue</span>
          <input className={styles.input} id={id('venue')} required maxLength={120} value={fields.venue} onChange={set('venue')} />
        </label>
        <label className={styles.field} htmlFor={id('startsAt')}>
          <span className={styles.label}>Starts, Manila time</span>
          <input className={styles.input} id={id('startsAt')} type="datetime-local" required value={fields.startsAt} onChange={set('startsAt')} />
        </label>
        <label className={`${styles.field} ${styles.narrow}`} htmlFor={id('capacity')}>
          <span className={styles.label}>Seats</span>
          <input className={styles.input} id={id('capacity')} type="number" min="1" max="2000" required value={fields.capacity} onChange={set('capacity')} />
        </label>
      </div>

      <label className={styles.field} htmlFor={id('description')}>
        <span className={styles.label}>Description</span>
        <textarea className={styles.area} id={id('description')} rows={3} maxLength={2000} value={fields.description} onChange={set('description')} />
      </label>

      <div className={styles.actions}>
        <Button type="submit" variant="primary" size="small" disabled={isSaving}>
          {isSaving ? 'Saving' : event ? 'Save changes' : 'Post this event'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="small" onClick={onCancel}>Cancel</Button>
        )}
      </div>

      {error && <StatusMessage kind="error">{error.message}</StatusMessage>}
    </form>
  )
}
