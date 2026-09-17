import { USING_MOCK_API } from '../api'

// Shown only while the simulated backend is switched on. It disappears by
// itself when VITE_USE_MOCK_API=false, because it reads the same variable the
// API layer does.
export default function DemoNotice() {
  if (!USING_MOCK_API) return null

  return (
    <div className="demo-notice" role="status">
      <strong>Demo mode.</strong> This site runs on a simulated backend: seats you
      save are stored in your own browser and shared with nobody. The Express API
      and PostgreSQL database come next.
    </div>
  )
}
