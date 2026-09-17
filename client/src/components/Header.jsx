import { Link, NavLink } from 'react-router-dom'
import { useStudent } from '../context/StudentContext.jsx'
import styles from './Header.module.css'

function Mark() {
  return (
    <svg className={styles.mark} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" fill="#15171A" />
      <rect x="4.5" y="4.5" width="6.5" height="6.5" fill="#FFD23F" />
      <rect x="13.75" y="5.25" width="5" height="5" fill="none" stroke="#FFD23F" strokeWidth="1.5" />
      <rect x="5.25" y="13.75" width="5" height="5" fill="none" stroke="#FFD23F" strokeWidth="1.5" />
      <rect x="13.75" y="13.75" width="5" height="5" fill="none" stroke="#FFD23F" strokeWidth="1.5" />
    </svg>
  )
}

const navClass = ({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`

export default function Header() {
  const { students, student, setStudentId } = useStudent()

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <Mark />
          SeatSaver
        </Link>
        <nav className={styles.nav} aria-label="Main">
          <NavLink to="/" end className={navClass}>Events</NavLink>
          <NavLink to="/my-seats" className={navClass}>My seats</NavLink>
        </nav>
        <div className={styles.picker}>
          <label htmlFor="student-picker" className={styles.pickerLabel}>Student</label>
          <select
            id="student-picker"
            value={student?.id ?? ""}
            onChange={(event) => setStudentId(event.target.value)}
            disabled={students.length === 0}
          >
            {students.length === 0 && <option value="">Loading</option>}
            {students.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
            ))}
          </select>
        </div>
      </div>
    </header>
  )
}
