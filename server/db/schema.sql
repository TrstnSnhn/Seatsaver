-- SeatSaver schema. Safe to run against an empty database, and safe to run twice.
--
-- Four tables: the orgs that post events, the students who may reserve, the
-- events themselves, and one reservation row per student per event.

CREATE TABLE IF NOT EXISTS orgs (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  short_name TEXT NOT NULL
);

-- Only an HAU student address may hold a seat, so the column checks the domain
-- here as well as in the API. An officer account carries is_admin.
CREATE TABLE IF NOT EXISTS students (
  id         SERIAL PRIMARY KEY,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL UNIQUE CHECK (email LIKE '%@student.hau.edu.ph'),
  student_no TEXT    NOT NULL UNIQUE,
  is_admin   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS events (
  id          SERIAL PRIMARY KEY,
  org_id      TEXT        NOT NULL REFERENCES orgs (id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  venue       TEXT        NOT NULL,
  starts_at   TIMESTAMPTZ NOT NULL,
  capacity    INTEGER     NOT NULL CHECK (capacity > 0),
  description TEXT        NOT NULL DEFAULT ''
);

-- A pending or approved row holds a seat. A rejected row keeps the history and
-- frees the seat. UNIQUE (event_id, student_id) is what stops one student from
-- holding two seats at the same event, whatever the API does.
CREATE TABLE IF NOT EXISTS reservations (
  id           SERIAL PRIMARY KEY,
  event_id     INTEGER     NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  student_id   INTEGER     NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at   TIMESTAMPTZ,
  UNIQUE (event_id, student_id)
);

-- Counting held seats is the most frequent query in the app.
CREATE INDEX IF NOT EXISTS reservations_event_status_idx
  ON reservations (event_id, status);

-- The events list always sorts soonest first.
CREATE INDEX IF NOT EXISTS events_starts_at_idx
  ON events (starts_at);
