# Weekly reports

Five minutes a week. Add a new section at the top; never edit an old one.

The value is entirely in writing them **while it is happening**. What took four
hours and why is invisible a month later, and it is exactly what your journal
needs.

---

## Week of 2026-09-28

**Done.** The Express API runs against a Neon PostgreSQL database with four tables. A seat request now needs an HAU student address that is on the roster: a gmail address gets `400`, an unknown HAU address gets `403`, a second request gets `409`. Two curl requests fired at the last seat of a 25-seat event came back `201` and `409`, and the event settled at 25 of 25. Officers answer requests at `/admin`, where approving keeps the seat held and rejecting frees it.

**Stuck.** `GET /api/students/:id/rsvps` returned every seat without its status, so the badge on My seats rendered blank. The route handler read `row.status`, but `EVENT_SELECT` only selects event columns, and the join to `reservations` never added one. Wrapping the select as a subquery and selecting `r2.status` alongside it fixed it.

**Hours.** About 11.

**Next.** Build the org dashboard for creating events, and put a key on the officer routes.

---

## Week of YYYY-MM-DD

**Done.** What actually works now, in the deployed app rather than on your laptop.

**Stuck.** What is not working, and the most specific description you can give.
"CORS" is not specific. "The preflight OPTIONS returns 404 because my router is
mounted above cors" is.

**Hours.** Roughly. You will need this to estimate anything, ever.

**Next.** One or two things, not a wish list.

---

## Week of YYYY-MM-DD

...
