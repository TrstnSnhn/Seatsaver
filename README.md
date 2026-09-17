# SeatSaver

SeatSaver lets a student-org officer at Holy Angel University post an event with a fixed number of seats, and lets a student reserve one of those seats in a single tap. Organizers see the real headcount before the day instead of reconciling a Google Form with a Messenger poll.

**Live site:** https://trstnsnhn.github.io/Seatsaver/
**API:** not deployed yet (planned for week 2)
**Demo video:** not recorded yet

> **This deployment runs in demo mode.** The interface is real; the backend is simulated in your browser so the site works without a server. See [Demo mode](#demo-mode).

## Status

Week 1 of 3. The repository still runs the class template's sample app (a ghost-sightings list) while the SeatSaver screens and API are built. This README describes the planned app and marks what exists today.

## What it does (planned)

- Browse upcoming events, filter by org and date range, and search by title
- Open an event and save a seat, or cancel the seat you hold
- See every event you hold a seat for on a My seats page
- As an org officer, create, edit, and delete events and see the attendee list

The API enforces two rules in PostgreSQL: an event cannot take more reservations than its seat limit, and a student cannot reserve the same event twice. Both answer `409 Conflict`.

## Built with

React and Vite on the front end, Express and PostgreSQL on the back end. The client deploys to GitHub Pages; the API and database hosts are not chosen yet.

## Running it yourself

**Requirements:** Node.js 20 or newer. PostgreSQL 15 or newer for the full stack.

**The client only, in demo mode.** No database needed.

    git clone https://github.com/TrstnSnhn/Seatsaver.git
    cd Seatsaver/client
    npm install
    cp .env.example .env        # VITE_USE_MOCK_API stays true
    npm run dev                 # http://localhost:5173

You should see the sample list and a demo-mode notice. Anything you add is stored in your browser's `localStorage`.

**The whole stack.** Needs a running PostgreSQL, local or hosted.

    # the API
    cd server
    npm install
    cp .env.example .env        # set DATABASE_URL to your database
    npm run db:reset            # creates the tables and adds sample rows
    npm run dev                 # http://localhost:3000

    # the client, in another terminal
    cd client
    npm install
    cp .env.example .env        # set VITE_USE_MOCK_API=false
    npm run dev

Check the API on its own first:

    curl http://localhost:3000/healthz     # is the process alive
    curl http://localhost:3000/readyz      # is the database reachable

## Environment variables

None of these are committed. Each folder's `.env.example` lists them with placeholder values.

| Name | Where | What it is |
| --- | --- | --- |
| `DATABASE_URL` | server | PostgreSQL connection string. Contains a password |
| `CORS_ORIGINS` | server | comma-separated origins allowed to call the API |
| `NODE_ENV` | server | `production` on the host |
| `PORT` | server | set by the host; do not set it yourself |
| `VITE_USE_MOCK_API` | client, at build time | only `false` turns demo mode off |
| `VITE_API_BASE_URL` | client, at build time | the API's public URL, no trailing slash |

Every `VITE_` value ends up in the built JavaScript and is public. No keys, passwords, or connection strings go in one.

## Demo mode

The client runs two ways, chosen by `VITE_USE_MOCK_API` at build time.

| `VITE_USE_MOCK_API` | What happens |
| --- | --- |
| unset, or `true` | The client answers its own requests from `localStorage`. No server, no database, nothing shared between visitors |
| `false` | The client calls the Express API at `VITE_API_BASE_URL`, which reads and writes PostgreSQL |

Demo mode lets the interface ship in week 1. The final submission turns it off.

## API (planned)

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/api/events?org=&from=&to=&q=` | list upcoming events with seats taken |
| `GET` | `/api/events/:id` | one event with its org and seats left |
| `POST` | `/api/orgs/:orgId/events` | create an event |
| `PATCH` | `/api/events/:id` | update an event's fields |
| `DELETE` | `/api/events/:id` | delete an event and its reservations |
| `POST` | `/api/events/:id/rsvps` | reserve a seat; `409` when full or already reserved |
| `DELETE` | `/api/events/:id/rsvps/:studentId` | cancel a reservation |
| `GET` | `/api/students/:id/rsvps` | the events a student holds a seat for |

## Project structure

    client/          React front end, built by Vite
      src/api/       one interface, two implementations (mock and HTTP)
      src/components/
    server/          Express API
      db/            pool, schema.sql, seed.sql, and a runner for them
    docs/            proposal, mockup, design system, weekly reports
    compose.yml      only for self-hosting

## Screenshots

None yet. Screenshots of the SeatSaver screens go in `docs/assets/` as they are built.

## Known issues and next steps

- The client and server still contain the template's sample sightings app
- No PostgreSQL has run for this project yet; the schema for orgs, events, students, and reservations comes next
- The seat limit under two simultaneous reservations is the biggest open risk

## Licence

MIT, see [LICENSE](LICENSE).
