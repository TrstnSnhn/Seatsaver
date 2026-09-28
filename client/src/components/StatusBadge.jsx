import { STATUS_LABELS } from '../api'
import styles from './StatusBadge.module.css'

// status: pending, approved, or rejected. The word carries the meaning, so the
// badge still reads correctly in greyscale.
export default function StatusBadge({ status }) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      <span className={styles.mark} aria-hidden="true" />
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
