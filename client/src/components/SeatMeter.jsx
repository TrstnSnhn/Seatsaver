import { seatsLeft } from '../api'
import styles from './SeatMeter.module.css'

// One square mark per seat. State is a mark, not only a colour: taken seats are
// solid, your seat has a yellow centre, open seats are outlines.
export default function SeatMeter({ taken, capacity, mine = false, size = 'regular' }) {
  const left = seatsLeft(capacity, taken)
  const marks = Array.from({ length: capacity }, (_, index) => {
    if (index >= taken) return 'open'
    if (mine && index === taken - 1) return 'yours'
    return 'taken'
  })

  return (
    <div className={`${styles.meter} ${size === 'mini' ? styles.mini : ''}`}>
      <div className={styles.marks} aria-hidden="true">
        {marks.map((state, index) => (
          <span key={index} className={`${styles.seat} ${styles[state]}`} />
        ))}
      </div>
      <p className={styles.readout}>
        <span className={styles.count}>{taken} / {capacity} taken</span>
        <span className={`${styles.badge} ${left > 0 ? styles.left : styles.full}`}>
          {left > 0 ? `${left} left` : 'Full'}
        </span>
      </p>
    </div>
  )
}
