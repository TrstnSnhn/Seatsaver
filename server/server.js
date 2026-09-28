// Starts the SeatSaver API against PostgreSQL.
//
// Set DATABASE_URL (see .env.example), then:
//   npm run db:reset      # creates the tables and adds sample rows
//   npm run dev           # http://localhost:3000
//
// Check it with:
//   curl http://localhost:3000/readyz
//   curl http://localhost:3000/api/events

import { createApp } from './app.js'
import { pool } from './db/pool.js'

const app = createApp(pool)

// The host chooses the port and passes it through PORT. Hardcoding 3000 is the
// commonest reason a first deploy is marked unhealthy and killed.
const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`SeatSaver API listening on http://localhost:${port}`)
  console.log(`CORS allows: ${process.env.CORS_ORIGINS || 'http://localhost:5173'}`)
})
