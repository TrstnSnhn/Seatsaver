import { Link } from 'react-router-dom'
import SeatMeter from './SeatMeter.jsx'
import { dateBlock, timeOf } from '../format.js'
import styles from './EventCard.module.css'

// Shared by the Events page and My seats. `action` fills the button slot.
export default function EventCard({ event, mine = false, action }) {
  const date = dateBlock(event.startsAt)

  return (
    <article className={styles.card}>
      <div className={styles.date} aria-hidden="true">
        <span className={styles.day}>{date.day}</span>
        <span className={styles.month}>{date.month}</span>
        <span className={styles.weekday}>{date.weekday}</span>
      </div>
      <div className={styles.body}>
        <span className={styles.tag}>{event.orgName}</span>
        <h3 className={styles.title}>
          <Link to={`/events/${event.id}`}>{event.title}</Link>
        </h3>
        <p className={styles.meta}>
          <time dateTime={event.startsAt}>
            {date.weekday} {date.day} {date.month}, {timeOf(event.startsAt)}
          </time>
          <span>{event.venue}</span>
        </p>
        <div className={styles.foot}>
          <SeatMeter taken={event.seatsTaken} capacity={event.capacity} mine={mine} size="mini" />
          {action}
        </div>
      </div>
    </article>
  )
}
