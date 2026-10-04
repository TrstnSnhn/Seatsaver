import { USING_MOCK_API } from '../api'

// Shown while the browser-only backend is on. It disappears by itself when
// VITE_USE_MOCK_API=false, because it reads the same variable the API layer
// does.
export default function DemoNotice() {
  if (!USING_MOCK_API) return null

  return (
    <div className="demo-notice" role="status">
      <strong>Sample data.</strong> This site runs on sample events, and the seats
      you request stay in your own browser. Point the same screens at the Express
      API to share them across visitors.
    </div>
  )
}
