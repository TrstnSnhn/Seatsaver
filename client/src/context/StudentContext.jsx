import { createContext, useContext, useEffect, useState } from 'react'
import { listStudents } from '../api'

// Version 1 has no login. The visitor picks a seeded student from the header,
// and every page reads that choice from here.
const StudentContext = createContext(null)
const STORAGE_KEY = 'seatsaver:student'

function readSavedId() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null // storage blocked (private mode): fall back to the first student
  }
}

export function StudentProvider({ children }) {
  const [students, setStudents] = useState([])
  const [studentId, setStudentId] = useState(readSavedId)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    listStudents()
      .then((list) => {
        if (!active) return
        setStudents(list)
        setStudentId((current) =>
          list.some((student) => student.id === current) ? current : list[0]?.id ?? null
        )
      })
      .catch((caught) => active && setError(caught))
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!studentId) return
    try {
      localStorage.setItem(STORAGE_KEY, studentId)
    } catch {
      // storage blocked: the choice lasts for this visit only
    }
  }, [studentId])

  const student = students.find((candidate) => candidate.id === studentId) ?? null

  return (
    <StudentContext.Provider value={{ students, student, setStudentId, error }}>
      {children}
    </StudentContext.Provider>
  )
}

export function useStudent() {
  const value = useContext(StudentContext)
  if (!value) throw new Error('useStudent must be used inside StudentProvider')
  return value
}
