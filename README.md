# SeatSaver

[![Made with AI](https://img.shields.io/badge/Made_with-AI_assistance-blue)](AI-USAGE.md)

Built with heavy assistance from Claude Code, Anthropic's CLI coding tool. What I asked for, what I kept, and where it got things wrong is written up in [AI-USAGE.md](AI-USAGE.md).

SeatSaver lets a student-org officer at Holy Angel University post an event with a fixed number of seats, and lets an HAU student request one of those seats with their school email. An officer approves or rejects each request from a queue, so organizers know the real headcount before the day instead of reconciling a Google Form with a Messenger poll.

**Live site:** https://trstnsnhn.github.io/Seatsaver/
**API:** Express and PostgreSQL, running against a Neon database. Not yet deployed to a public host
**Demo video:** coming in week 3

> **The deployed site runs in demo mode.** You use the real interface while your browser simulates the backend, so the site works without a server. Run the API yourself to see the database path. See [Demo mode](#demo-mode).

![The officer request queue: four requests, each with the student, the event, the seat count, and Approve and Reject buttons](docs/assets/screenshot-admin-requests.png)

## Status

End of week 2 of 3. The Express API and the PostgreSQL schema are live on Neon. Two rules run in the database: only an address on the HAU student roster can request a seat, and the seat limit holds under two simultaneous requests. Officers answer requests in a queue. Week 3 adds the org dashboard for creating events, the deployed API, and the demo video.

## What it does

**Students**

- **Events** lists events, soonest first, with an org filter, a date range, and a title search
- **Event detail** shows the venue, the time, and a seat meter, plus the request form
- Requesting a seat needs an HAU student address ending in `@student.hau.edu.ph` that is on the roster. Any other address is refused with the reason
- **My seats** lists the seats the current student holds, each marked waiting for approval or approved. A rejected request holds nothing, so it drops off the list
- A **student picker** in the header stands in for login. Pick a seeded student and every screen follows

**Officers**

- **Requests** lists every waiting request with the student, the student number, the event, and the seat count at that moment
- **Approve** keeps the seat held. **Reject** frees it for someone else
- Tabs switch between waiting, approved, and rejected
- Students who are not officers never see the link, and typing `/admin` shows them why the page is closed

**Rules the database enforces**

- A pending or an approved reservation holds a seat. A rejected one frees it
- One reservation per student per event, through `UNIQUE (event_id, student_id)`
- A seat limit that holds under concurrent requests, through `SELECT ... FOR UPDATE` on the event row inside a transaction
- An email that ends in `@student.hau.edu.ph`, through a `CHECK` constraint on `students.email`

**Planned for week 3**

- An **Org dashboard** where officers create, edit, and delete events
- The API deployed to a public host so the live site can leave demo mode
- A report of the most-requested events

## Setup and installation

**Requirements**

| Tool | Version | Why |
| --- | --- | --- |
| Node.js | 20 or newer | the client build and the API both use it |
| PostgreSQL | 16 or newer | local database, or a free Neon project |
| Git | any recent version | to clone the repository |

**1. Get the code**

    git clone https://github.com/TrstnSnhn/Seatsaver.git
    cd Seatsaver

**2. Set up the database**

Create a database, either locally or on [Neon](https://neon.tech). Neon gives you a connection string that ends in `?sslmode=require`.

    cd server
    npm install
    cp .env.example .env

Open `.env` and put your own connection string in `DATABASE_URL`. The file is git-ignored, so your password stays on your machine.

    npm run db:reset      # creates the tables, then loads the sample data

`db:reset` runs `db:schema` and then `db:seed`. The seed empties the tables first, so you can run it again whenever you want the sample data back.

**3. Start the API**

    npm run dev           # http://localhost:3000

Check it:

    curl http://localhost:3000/readyz
    {"ok":true,"db":"up"}

**4. Start the client**

In a second terminal:

    cd client
    npm install
    cp .env.example .env

To run against the API you just started, set both values in `client/.env`:

    VITE_USE_MOCK_API=false
    VITE_API_BASE_URL=http://localhost:3000

Then:

    npm run dev           # http://localhost:5173

You should see the Events screen with ten sample events, and no demo-mode notice under the header. Leaving `VITE_USE_MOCK_API` at `true` skips steps 2 and 3 and runs the simulated backend instead.

**Tests.** Both suites need no browser and no database:

    cd server && npm test     # 4 tests, node:test
    cd client && npm test     # 6 tests, node:test

**Production build**, the same one GitHub Pages serves:

    cd client
    npm run build
    npm run preview           # http://localhost:4173

## Environment variables

Keep these out of git. Each folder's `.env.example` lists them with placeholder values.

| Name | Where | Example | What it is |
| --- | --- | --- | --- |
| `DATABASE_URL` | server | `postgresql://user:pass@host.neon.tech/seatsaver?sslmode=require` | PostgreSQL connection string. Contains a password |
| `CORS_ORIGINS` | server | `http://localhost:5173` | comma-separated origins allowed to call the API |
| `NODE_ENV` | server | `development` | set it to `production` on a host |
| `PORT` | server | set by the host | do not set it yourself |
| `VITE_USE_MOCK_API` | client, at build time | `false` | only `false` turns demo mode off; unset means on |
| `VITE_API_BASE_URL` | client, at build time | `http://localhost:3000` | the API's public URL, no trailing slash |

Vite copies each `VITE_` value into the built JavaScript, where anyone can read it. Never put a key, a password, or a connection string in one.

## Using it

**As a student**

1. Open the site. The header starts on the first student in the list.
2. Pick an event card and choose **View**. The seat meter shows one square per seat: solid squares are taken, outlines are open.
3. Type an HAU student address and choose **Request a seat**. Try `angelo@gmail.com` first to see the domain check refuse it.
4. A valid request holds the seat and shows **Waiting for approval**.
5. Open **My seats** to see every seat the student holds, with its status.

**As an officer**

1. Switch the header picker to Rhea Castro, the seeded officer.
2. A **Requests** link appears in the navigation. Open it.
3. Choose **Approve** to keep a seat held, or **Reject** to free it. The row leaves the waiting tab and appears under approved or rejected.

## API

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/healthz` | the process is up |
| `GET` | `/readyz` | the process is up and the database answers |
| `GET` | `/api/orgs` | list student orgs |
| `GET` | `/api/students` | list students for the picker |
| `GET` | `/api/events?org=&from=&to=&q=` | list events with seats held, soonest first |
| `GET` | `/api/events/:id` | one event with its org and seats held |
| `POST` | `/api/events/:id/rsvps` | request a seat, body `{ "email": "bea.manalo@student.hau.edu.ph" }` |
| `DELETE` | `/api/events/:id/rsvps/:studentId` | cancel a reservation; `204`, or `404` when there is none |
| `GET` | `/api/students/:id/rsvps` | the seats a student holds, each with its status |
| `GET` | `/api/admin/requests?status=pending` | the officer queue, by status |
| `POST` | `/api/admin/requests/:id/approve` | approve a waiting request; `404` once it is answered |
| `POST` | `/api/admin/requests/:id/reject` | reject a waiting request and free the seat |

`POST /api/events/:id/rsvps` answers in this order:

| Status | When |
| --- | --- |
| `400` | the address does not end in `@student.hau.edu.ph` |
| `403` | the address is not on the student roster |
| `409` | the student already has a request for this event, or the event is full |
| `201` | the request is recorded as `pending` and the seat is held |

Planned with the org dashboard: `POST /api/orgs/:orgId/events`, `PATCH /api/events/:id`, `DELETE /api/events/:id`.

## Database

Four tables. `server/db/schema.sql` creates them and `server/db/seed.sql` fills them with 5 orgs, 129 students, 10 events, and about 250 reservations.

| Table | Holds | Rules that live here |
| --- | --- | --- |
| `orgs` | student orgs | unique name |
| `students` | the roster | unique email, `CHECK` that it ends in `@student.hau.edu.ph`, `is_admin` for officers |
| `events` | events with a seat limit | `capacity > 0`, foreign key to `orgs` |
| `reservations` | requests and their answers | `status` in `pending`, `approved`, `rejected`; `UNIQUE (event_id, student_id)` |

Seats held are counted, never stored: `count(*)` over reservations whose status is `pending` or `approved`. There is no counter to fall out of step with the rows.

## Demo mode

The client runs two ways, chosen by `VITE_USE_MOCK_API` at build time.

| `VITE_USE_MOCK_API` | What happens |
| --- | --- |
| unset, or `true` | `client/src/api/mockApi.js` answers from `localStorage`, starting from `seed.json`. No server, no database, nothing shared between visitors |
| `false` | `client/src/api/httpApi.js` calls the Express API at `VITE_API_BASE_URL` |

Both files export the same nine functions and apply the same rules, including the HAU domain check, so switching to the live API needs no screen changes. Demo mode stores everything under `seatsaver:db:v2`. Clear site data to start again from the sample events.

## Project structure

    client/
      src/api/           mockApi.js and httpApi.js (same functions), rules.js, seed.json
      src/pages/         EventsPage, EventDetailPage, MySeatsPage, AdminPage, NotFoundPage
      src/components/    Header, EventCard, SeatMeter, StatusBadge, FilterBar, Button, StatusMessage
      src/context/       StudentContext: the selected student, shared across pages
      src/styles.css     design tokens as CSS custom properties
    server/
      app.js             routes and the JSON shapes they return
      repos.js           every SQL statement, all values passed as parameters
      validation.js      the HAU email rule, shared with the tests
      db/schema.sql      tables, constraints, and indexes
      db/seed.sql        sample orgs, students, events, and reservations
    docs/                planning documents, weekly reports, and screenshots in assets/

## Screenshots

**Event detail**, right after a request goes in:

![Event detail for the Git Rescue Clinic: 22 of 24 seats taken, a Waiting for approval badge, and a message saying the seat is held while an officer reviews it](docs/assets/screenshot-request-seat.png)

**My seats**, showing both statuses:

![My seats: one card marked Seat approved and one marked Waiting for approval, each with a Cancel button](docs/assets/screenshot-my-seats-status.png)

**The request queue** on a 390px phone:

![The officer queue on a phone: each request stacks the student, the event, and the Approve and Reject buttons](docs/assets/screenshot-admin-phone.png)

## Known issues and next steps

- The API runs on my machine, so the deployed site stays in demo mode until I host it in week 3
- Officers are marked by `is_admin` in the database and the client trusts that flag. There is no login, so anyone who can reach the API can call the admin routes. Week 3 adds a shared officer key at minimum
- A rejected request frees the seat and then vanishes from the student's My seats list, with no email and no notice. The student can only tell by opening the event again, which is the first thing I would fix
- The org dashboard for creating and editing events is not built
- `npm test` covers the pure rules. The SQL path is checked by hand with curl, and a seed-and-query test would catch more

## Licence

MIT, see [LICENSE](LICENSE).
