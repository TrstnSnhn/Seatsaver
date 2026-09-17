import { Route, Routes } from 'react-router-dom'
import Header from './components/Header.jsx'
import DemoNotice from './components/DemoNotice.jsx'
import EventsPage from './pages/EventsPage.jsx'
import EventDetailPage from './pages/EventDetailPage.jsx'
import MySeatsPage from './pages/MySeatsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import styles from './App.module.css'

export default function App() {
  return (
    <div className={styles.shell}>
      <Header />
      <DemoNotice />
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/my-seats" element={<MySeatsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className={styles.footer}>
        SeatSaver, a 6APSI final project. Events and names on this site are sample data.
      </footer>
    </div>
  )
}
