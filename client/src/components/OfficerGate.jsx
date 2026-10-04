import { useEffect, useState } from 'react'
import { checkOfficerKey, readOfficerKey, writeOfficerKey } from '../api'
import Button from './Button.jsx'
import { StatusMessage } from './StatusMessage.jsx'
import styles from './OfficerGate.module.css'

// The lock on the officer screens.
//
// The key is a shared password kept in the server environment. This asks for it
// once per tab, checks it against the API, and only then renders the dashboard.
// Hiding the screen is not the protection: the API refuses every officer route
// without the key, whatever the browser decides to draw.
export default function OfficerGate({ title, children }) {
  const [state, setState] = useState(() => (readOfficerKey() ? 'checking' : 'locked'))
  const [key, setKey] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (state !== 'checking') return
    let active = true
    checkOfficerKey()
      .then(() => active && setState('open'))
      .catch((caught) => {
        if (!active) return
        writeOfficerKey('')
        setError(caught)
        setState('locked')
      })
    return () => {
      active = false
    }
  }, [state])

  function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    writeOfficerKey(key.trim())
    setKey('')
    setState('checking')
  }

  if (state === 'checking') return <StatusMessage kind="loading">Checking your officer key</StatusMessage>

  if (state === 'open') {
    return (
      <>
        <div className={styles.bar}>
          <span className={styles.badge}>Officer</span>
          <button
            type="button"
            className={styles.signOut}
            onClick={() => {
              writeOfficerKey('')
              setState('locked')
            }}
          >
            Forget my key
          </button>
        </div>
        {children}
      </>
    )
  }

  return (
    <form className={styles.gate} onSubmit={handleSubmit}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.hint}>
        This screen belongs to org officers. Type the officer key to open it. The key stays in this
        tab and is gone when you close it.
      </p>
      <label className={styles.label} htmlFor="officer-key">Officer key</label>
      <input
        id="officer-key"
        className={styles.input}
        type="password"
        autoComplete="current-password"
        required
        value={key}
        onChange={(field) => setKey(field.target.value)}
      />
      <Button type="submit" variant="primary">Open the dashboard</Button>
      {error && <StatusMessage kind="error">{error.message}</StatusMessage>}
    </form>
  )
}
