import styles from './StatusMessage.module.css'

// kind: loading, success, or error. Each carries its own mark so none relies on
// colour alone, and screen readers announce success and errors.
export function StatusMessage({ kind, children }) {
  const role = kind === 'error' ? 'alert' : 'status'
  return (
    <p className={`${styles.status} ${styles[kind]}`} role={role}>
      <span className={styles.icon} aria-hidden="true" />
      {children}
    </p>
  )
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className={styles.empty}>
      <h2 className={styles.emptyTitle}>{title}</h2>
      {hint && <p className={styles.hint}>{hint}</p>}
      {action}
    </div>
  )
}
