# Weekly Increment Report

## Week of: 14 September 2026 (week 1 of 3)

**Repository:** https://github.com/TrstnSnhn/Seatsaver
**Live site:** https://trstnsnhn.github.io/Seatsaver/ (demo mode)

## What changed this week

- **Set up the project repository** from `HAU-6APSI/final-project-template`, public in my own account. I turned on GitHub Pages with the Actions source, gave the page a SeatSaver title, and replaced the template README. Commit [`21f7a84`](https://github.com/TrstnSnhn/Seatsaver/commit/21f7a84).
- **Built the data layer in demo mode.** `mockApi.js` and `httpApi.js` now export the same seven SeatSaver functions: orgs, students, events, one event, reserve a seat, cancel a seat, and a student's seats. `rules.js` holds the seat-limit and one-seat-per-student rules, and `npm test` runs four `node:test` cases against them. The sample data has 5 orgs, 8 students, and 10 events, including one full event and three with a single seat left. Commit [`ea31a20`](https://github.com/TrstnSnhn/Seatsaver/commit/ea31a20).
- **Built three screens** with React Router: Events (org, date range, and title filters), Event detail (Save my seat and Cancel my seat), and My seats. A student picker in the header stands in for login. Every screen has loading, empty, and error states, and the styles follow my planning design system. Commit [`3f594b7`](https://github.com/TrstnSnhn/Seatsaver/commit/3f594b7).
- **Fixed the date filter**, which compared UTC dates. Commit [`8d70d00`](https://github.com/TrstnSnhn/Seatsaver/commit/8d70d00).
- **Documented the week** in the repository README: what works, how to use it, setup, tests, environment variables, the API the client calls, and three screenshots. Commit [`4f773eb`](https://github.com/TrstnSnhn/Seatsaver/commit/4f773eb).
- **Linked the project** from this workspace in `project/README.md`.

## Why

The template recommends building the interface first, in demo mode, so the live link works before any server exists. I built the three student screens first because they cover the whole reservation flow from my proposal: find an event, save a seat, see and cancel it.

Both API files export the same functions. When the Express API is ready, switching over takes one build variable (`VITE_USE_MOCK_API=false`) and no screen changes.

I wrote the reservation rules as a small module with tests so the rule from my proposal's risk section exists in code before the database does. A full event and a second reservation by the same student both reject with `409`, the status the API will send.

I built this week's code with Claude Code, an AI coding tool. I chose the scope and the order, checked each screen in the browser, and read the diffs before each commit.

## What broke or what I got stuck on

- **The date filter was off by a day for early events.** It sliced the UTC timestamp, and Manila is eight hours ahead, so an event before 8am Manila time counted as the previous day. The fix formats the date in `Asia/Manila` first. I checked it against 11:30pm UTC on 24 September, which is 25 September in Manila.
- **`node --test src/api/` failed on Windows.** Node treated the directory as a single test file. I pointed the `test` script at `src/api/rules.test.js` instead.
- **Deep links on GitHub Pages answer with HTTP 404.** Pages has no route for `/Seatsaver/events/evt-1`, so it serves `404.html`, a copy of the app, and React Router renders the right screen. The page works, but the browser console logs the 404.
- **My commits would have published my personal email.** My global git config uses my Gmail, and this repository is public. I set a repository-only identity with GitHub's noreply address before the first push.
- **No database yet.** I have no PostgreSQL on my laptop, and the course unit on running Postgres (`content/extending-your-app/`) is not in my workspace yet. The seat-limit rule is only tested in the simulated backend, so two students taking the last seat at the same moment is still untested.

## What is left

- **Week 2:** create the Neon database; write `schema.sql` for orgs, events, students, and reservations, with `UNIQUE (event_id, student_id)`; enforce the seat limit in SQL; implement the seven API routes in Express; deploy the API; switch the live site off demo mode.
- **Week 2:** the Org dashboard, where officers create, edit, and delete events and see attendees.
- **Week 3:** the most-reserved events report, a final README pass, and the presentation (video, slides, square image).
