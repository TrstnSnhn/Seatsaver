# AI usage

SeatSaver is built with heavy AI assistance. I use Claude Code, Anthropic's CLI coding tool, in almost every session. I decide the scope, the order, and the trade-offs, I run the code against my own database, and I read the diff before each commit. This file records what that looked like week by week, and it is updated as the work happens rather than written at the end.

Started in week 1 and kept up since.

## 1. How I used AI

### 2026-09-17, Claude Code: the demo-mode data layer

**Asked for:** a simulated backend that answers the same function calls as a real API, so the site works on GitHub Pages before any server exists.

**Got back:** `mockApi.js` reading from `seed.json` into `localStorage`, `httpApi.js` calling `fetch`, and `index.js` choosing between them with one build variable.

**Kept and changed:** I kept the split. The point of it is mine: I wanted to switch to the real API by changing one setting rather than editing screens, and that is exactly what happened in week 2. I asked for the artificial delay in `mockApi.js` so the loading states are real instead of instant.

**Commit:** [`ea31a20`](https://github.com/TrstnSnhn/Seatsaver/commit/ea31a20)

### 2026-09-17, Claude Code: the three student screens

**Asked for:** Events, Event detail, and My seats, using React Router and the tokens from my own design system.

**Got back:** the four page components, the shared `EventCard`, `SeatMeter`, `Button`, and `StatusMessage`, and CSS Modules using the tokens.

**Kept and changed:** I kept the structure. The seat meter drawing one square per seat is my design decision from my planning documents, and I asked for it to be redone when the first version used a progress bar, which loses the one-square-per-seat idea.

**Commit:** [`3f594b7`](https://github.com/TrstnSnhn/Seatsaver/commit/3f594b7)

### 2026-09-17, Claude Code: the Manila date bug

**Asked for:** a fix for the date filter, which put morning events on the previous day.

**Got back:** `manilaDateKey`, formatting the timestamp in `Asia/Manila` with the `en-CA` locale before comparing it with the `<input type="date">` value.

**Kept and changed:** kept as written, after I checked it against 11:30pm UTC on 24 September, which is 25 September in Manila. I found the bug by clicking through the filter myself.

**Commit:** [`8d70d00`](https://github.com/TrstnSnhn/Seatsaver/commit/8d70d00)

### 2026-09-17, Claude Code: the week 1 README

**Asked for:** documentation covering setup, tests, environment variables, and the API the client calls.

**Got back:** the README sections, with three screenshots taken from the running app.

**Kept and changed:** I cut a paragraph that claimed the API existed. It did not exist in week 1, and the documentation is graded on matching the real code.

**Commit:** [`4f773eb`](https://github.com/TrstnSnhn/Seatsaver/commit/4f773eb)

### 2026-09-28, Claude Code: the schema and the seat-limit race

**Asked for:** a PostgreSQL schema for orgs, students, events, and reservations, and a seat limit that survives two students pressing the button at the same moment.

**Got back:** `schema.sql` with `UNIQUE (event_id, student_id)` and the status `CHECK`, and a `requestSeat` that opens a transaction and locks the event row with `SELECT ... FOR UPDATE` before counting seats.

**Kept and changed:** kept. I tested the claim rather than trusting it: two curl requests at the last seat of a 25-seat event returned `201` and `409`, and the event settled at 25 of 25. That race was the main risk in my proposal, so I wanted to see the two answers myself.

**Commit:** [`1cc8dc7`](https://github.com/TrstnSnhn/Seatsaver/commit/1cc8dc7)

### 2026-09-28, Claude Code: the HAU check and the officer queue

**Asked for:** my instructor's two suggestions. Check that a person requesting a seat is really an HAU student, and give officers a screen for accepting or rejecting requests.

**Got back:** an email on the request body with the checks ordered domain, roster, seat rules; `reservations.status` with three values; the `/admin` queue; and the status badges on My seats.

**Kept and changed:** I set the order of the checks so the message tells the student what is actually wrong, rather than one `403` for everything. I also asked for the reject button to stop being solid red, because six red buttons in a queue read as six alarms.

**Commit:** [`1cc8dc7`](https://github.com/TrstnSnhn/Seatsaver/commit/1cc8dc7)

## 2. Where the AI got it wrong

### The seats query dropped the column the route reported

`GET /api/students/:id/rsvps` mapped `row.status` in the route handler, but the SQL behind it reused a shared `EVENT_SELECT` that lists event columns only, and the join to `reservations` added nothing. The API answered with no status, so the badge on My seats rendered blank, and no test caught it because the tests cover the pure rules and not the SQL. The fix wraps the select as a subquery and selects `r2.status` beside it. The lesson I took: reading the route handler is not reading the query it calls.

**Commit:** [`1cc8dc7`](https://github.com/TrstnSnhn/Seatsaver/commit/1cc8dc7)

### A deleted file was still imported

While replacing the class template's sample API, `sightingsRepo.js` was deleted while `server.js` still imported it, and the server died on start with `ERR_MODULE_NOT_FOUND`. A clean delete is not a delete of one file, it is a delete of every reference to it. `server.js` is now a thin entry that imports `createApp(pool)`.

**Commit:** [`1cc8dc7`](https://github.com/TrstnSnhn/Seatsaver/commit/1cc8dc7)

### A test file carried my real HAU username into a public repository

A validation test used my own `@student.hau.edu.ph` address as its example. The finals rules say no name, student number, or email in the public project repository, and nothing in the generated code knew that. I caught it in the scan I run before every push and replaced it with a sample address. This is the kind of mistake that no amount of green tests catches.

**Commit:** [`1cc8dc7`](https://github.com/TrstnSnhn/Seatsaver/commit/1cc8dc7)

### The first mobile screenshots were wrong

Headless Chrome with `--window-size=390` renders a wider viewport and crops, so the "phone" screenshots in week 1 showed a cropped desktop layout rather than the mobile one. Screenshots are evidence in my documentation, and cropped evidence is worse than none.

**Commit:** [`4f773eb`](https://github.com/TrstnSnhn/Seatsaver/commit/4f773eb)

## 3. Who wrote what

> **To finish before the week 3 deadline.** This section is mine to write, and it
> has to be accurate, so I am not filling it with a generated answer. For each
> part I name: the file, the commit, what it does, and why it is built that way,
> in my own words.
>
> The parts I plan to name as my own:
>
> - the design system in `client/src/styles.css` and the planning documents it comes from
> - the seat meter's one-square-per-seat idea, which I specified and then corrected
> - the order of the three refusals on a seat request, and the wording of each message
>
> The AI-written piece I understand best and will explain in full: the transaction
> in `requestSeat` in `server/repos.js`, the `BEGIN`, the `SELECT ... FOR UPDATE`
> on the event row, the seat count, and the `COMMIT`, and why the lock has to come
> before the count.
