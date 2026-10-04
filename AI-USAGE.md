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

### 2026-10-04, Claude Code: the officer key

**Asked for:** a lock on the officer routes. Until this week `is_admin` lived in the database and the client simply trusted it, so anyone who found the API could approve their own request.

**Got back:** a `requireOfficer` middleware reading `OFFICER_KEY` from the server environment, an `x-officer-key` header on every request from the client, and an `OfficerGate` component that asks for the key once per tab.

**Kept and changed:** I asked for two things specifically. The key goes in `sessionStorage` rather than `localStorage`, because this is a shared password typed on a lab computer and it should die with the tab. And a server with no key configured answers `503` on every officer route rather than letting everything through, so forgetting the key closes the door instead of removing it.

**Commit:** [`898561c`](https://github.com/TrstnSnhn/Seatsaver/commit/898561c)

### 2026-10-04, Claude Code: the org dashboard

**Asked for:** the last piece of my proposal. Officers post an event, edit it, delete it, and read the attendee list, plus a report of the most-requested events.

**Got back:** `POST /api/orgs/:orgId/events`, `PATCH /api/events/:id`, `DELETE /api/events/:id`, `GET /api/events/:id/attendees`, `GET /api/admin/report`, and the Manage screen with one form used for both posting and editing.

**Kept and changed:** I asked for the `PATCH` to write only the fields that arrive, so editing a venue cannot overwrite a description with a stale copy from the form. I also asked for the overbooking refusal: lowering a seat limit below the seats already held returns `409`, because no later request could undo an event with more students than chairs.

**Commit:** [`898561c`](https://github.com/TrstnSnhn/Seatsaver/commit/898561c)

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

### The event form grew a gap under the textarea

The officer form put `flex: 1 1 200px` on every field, which is right for the fields sharing a row and wrong for the ones stacked in the column: a column child with `flex-grow: 1` stretches to fill the form's height, so the description field pushed the submit button to the bottom of a tall empty box. I caught it in a screenshot rather than in the markup, and scoped the rule to `.row .field`.

**Commit:** [`898561c`](https://github.com/TrstnSnhn/Seatsaver/commit/898561c)

### The first mobile screenshots were wrong

Headless Chrome with `--window-size=390` renders a wider viewport and crops, so the "phone" screenshots in week 1 showed a cropped desktop layout rather than the mobile one. Screenshots are evidence in my documentation, and cropped evidence is worse than none.

**Commit:** [`4f773eb`](https://github.com/TrstnSnhn/Seatsaver/commit/4f773eb)

## 3. Who wrote what

Start with the part that costs me marks to admit: Claude Code typed most of the lines in this repository. What follows names the parts I decided, specified, corrected and tested, and then explains the one AI-written piece I understand best. Each one gives the file and the commit.

### The design system

**File:** `client/src/styles.css`, with the planning documents in `docs/`
**Commit:** [`3f594b7`](https://github.com/TrstnSnhn/Seatsaver/commit/3f594b7)

The tokens come from my planning documents: one committed yellow, ink on cool grey paper, Archivo in its condensed widths, zero radius, 8px spacing. I chose them before any code existed, and the rule I held to was that no component file writes a hex value or a pixel gap of its own. Each one reads `var(--color-field)` or `var(--space-2)`.

That rule earned itself twice. When I added the officer screens in week 3, the new buttons, badges and tables matched the rest without a single new colour. When I wanted the reject button quieter, I changed one declaration rather than hunting for red across six files.

### One square per seat

**File:** `client/src/components/SeatMeter.jsx`
**Commit:** [`3f594b7`](https://github.com/TrstnSnhn/Seatsaver/commit/3f594b7)

I specified one square per seat in my planning documents and held to it in the build. A progress bar tells you a ratio, and the question a student asks is "how many seats are left". Twenty-five squares with three outlines reads as three seats, with no arithmetic.

The second rule is mine too: state is a mark, never a colour alone. A taken seat is solid, an open one is an outline, and your own seat carries a yellow centre. Someone who cannot tell my yellow from my grey still reads the meter, and the count beside it repeats the same fact in words.

### The order of the three refusals

**File:** `server/app.js`, the `POST /api/events/:id/rsvps` handler
**Commit:** [`1cc8dc7`](https://github.com/TrstnSnhn/Seatsaver/commit/1cc8dc7)

My instructor asked for a check that a reserver is really an HAU student. One `403` would have covered every refusal. I split it into three, in this order: the domain, then the roster, then the seat rules.

The order is the point. A gmail address is a mistake the student can fix by retyping, so it gets `400` and a message naming the domain. An HAU address that is not on the roster is a problem only an officer can fix, so it gets `403` and tells the student to ask one. Asking twice is `409`, and so is a full event. I wrote each message to say what to do next instead of what went wrong.

### Testing the seat limit

**File:** `server/repos.js`, and two curl requests fired at once
**Commit:** [`1cc8dc7`](https://github.com/TrstnSnhn/Seatsaver/commit/1cc8dc7)

I named the double-booked last seat as the main risk in my proposal, and I refused to take "the transaction handles it" on trust. With event 4 at 24 of 25 seats held, I fired two requests at the same moment and read both answers: one `201`, one `409`, and the event settled at 25 of 25.

Demo mode never gets this test, and cannot pass it. Its data lives in one browser's `localStorage`, so two visitors never compete for the same seat. The seat limit is only real once PostgreSQL holds it, which is why the README says so.

### Failing closed on the officer key

**File:** `server/app.js`, the `requireOfficer` middleware
**Commit:** [`898561c`](https://github.com/TrstnSnhn/Seatsaver/commit/898561c)

A guard has to decide what to do when nobody configured a key. I asked for `503` on every officer route, rather than comparing an absent header with an empty string and letting the request through.

The reasoning is about which mistake I would rather make. Forgetting to set `OFFICER_KEY` on a host is easy, and a guard that opens on a missing key turns that slip into an unlocked dashboard. The same thinking put the key in `sessionStorage` rather than `localStorage`: this is a shared password typed on a lab computer, and it should die when the tab closes.

### The AI-written piece I understand best

**File:** `server/repos.js`, the `requestSeat` function
**Commit:** [`1cc8dc7`](https://github.com/TrstnSnhn/Seatsaver/commit/1cc8dc7)

Claude Code wrote this one. Here is what it does, line by line.

```sql
BEGIN;
SELECT id, capacity FROM events WHERE id = $1 FOR UPDATE;
```

`BEGIN` opens a transaction, so everything that follows either lands together or not at all. `FOR UPDATE` is the load-bearing part: it locks that one event row until the transaction ends. A second request for the same event stops at this line and waits. Two students pressing the button in the same second take turns instead of running side by side.

Next it counts:

```sql
SELECT count(*)::int FROM reservations WHERE event_id = $1 AND status = ANY ($2);
```

The count comes after the lock, and that order decides whether the whole thing works. Counting first and locking second would let both requests read "24 of 25 taken" before either inserted, and the event would end up at 26. Because the second request waits at the lock, it counts the seat the first one just took, sees 25 of 25, and gets `full` back.

Then it inserts and commits. A student whose earlier request an officer rejected is updated back to `pending` rather than inserted again, because `UNIQUE (event_id, student_id)` allows one row per student per event and I want their history kept.

The rollbacks matter as much as the inserts. Every refusal path runs `ROLLBACK` before returning, and the `finally` block releases the client back to the pool. Without that release the pool runs out of connections after a few refused requests, and the whole API stops answering.

What I take from reading it: the lock is not about speed, it is about order. The database is the only place that can put two simultaneous requests in a line, which is why this rule lives in SQL and not in my JavaScript.
