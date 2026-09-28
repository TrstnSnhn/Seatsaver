-- Sample data for development and for the demo.
--
-- This starts with TRUNCATE, which is right on a development database and wrong
-- on one a live demo depends on. Check which DATABASE_URL is loaded first.
--
-- Every person here is invented. The student numbers and addresses follow the
-- HAU pattern so the domain check has something realistic to accept.

TRUNCATE TABLE reservations, events, students, orgs RESTART IDENTITY CASCADE;

INSERT INTO orgs (id, name, short_name) VALUES
  ('org-cs', 'Computing Society', 'CompSoc'),
  ('org-dc', 'Debate Circle', 'Debate'),
  ('org-pg', 'Photography Guild', 'PhotoGuild'),
  ('org-rc', 'Robotics Club', 'Robotics'),
  ('org-kc', 'Kapampangan Culture Circle', 'KCC');

-- The eight students in the demo picker, plus one officer who reviews requests.
INSERT INTO students (name, email, student_no, is_admin) VALUES
  ('Bea Manalo',       'bea.manalo@student.hau.edu.ph',       '20240001', FALSE),
  ('Carlo Dizon',      'carlo.dizon@student.hau.edu.ph',      '20240002', FALSE),
  ('Jasmine Pineda',   'jasmine.pineda@student.hau.edu.ph',   '20240003', FALSE),
  ('Miguel Santos',    'miguel.santos@student.hau.edu.ph',    '20240004', FALSE),
  ('Andrea Lacson',    'andrea.lacson@student.hau.edu.ph',    '20240005', FALSE),
  ('Paolo Yap',        'paolo.yap@student.hau.edu.ph',        '20240006', FALSE),
  ('Kristine Mercado', 'kristine.mercado@student.hau.edu.ph', '20240007', FALSE),
  ('Rafael Tuazon',    'rafael.tuazon@student.hau.edu.ph',    '20240008', FALSE),
  ('Rhea Castro',      'rhea.castro@student.hau.edu.ph',      '20230011', TRUE);

-- Everyone else on campus, so seat counts look like a real event rather than a
-- handful of rows.
INSERT INTO students (name, email, student_no)
SELECT
  'Student ' || lpad(i::text, 3, '0'),
  'student' || lpad(i::text, 3, '0') || '@student.hau.edu.ph',
  '2025' || lpad(i::text, 4, '0')
FROM generate_series(1, 120) AS i;

INSERT INTO events (org_id, title, venue, starts_at, capacity, description) VALUES
  ('org-cs', 'Intro to Web Accessibility', 'SJH Auditorium', '2026-10-02T05:00:00Z', 40,
   'A 90-minute hands-on session on making React apps usable with a keyboard and a screen reader. Bring a laptop with Node installed.'),
  ('org-dc', 'Open Parliamentary Debate Night', 'PGN Building, Room 402', '2026-10-03T09:00:00Z', 30,
   'Four teams, one motion announced fifteen minutes before the first speech. Spectators welcome to stay for the adjudication.'),
  ('org-pg', 'Golden Hour Photo Walk', 'Main Gate', '2026-10-04T09:30:00Z', 20,
   'A slow walk around campus at sunset. Phone cameras are fine. The guild lends out three cameras on a first come, first served basis.'),
  ('org-rc', 'Line-Follower Robot Build', 'Engineering Lab 2', '2026-10-06T06:00:00Z', 25,
   'Teams of three build a small line-following robot from a kit. The club supplies the kits, so the seat limit matches the number of kits.'),
  ('org-kc', 'Kapampangan Language Circle', 'MGN Building, Room 210', '2026-10-07T07:00:00Z', 35,
   'Conversation practice for beginners and heritage speakers. This week covers greetings, numbers, and ordering at the canteen.'),
  ('org-cs', 'Git Rescue Clinic', 'CCS Laboratory 3', '2026-10-08T06:00:00Z', 24,
   'Bring the repository you broke. Officers help untangle merge conflicts, detached heads, and the commit that should never have been pushed.'),
  ('org-dc', 'Public Speaking Basics', 'SJH Auditorium', '2026-10-10T02:00:00Z', 60,
   'A morning workshop on structuring a three-minute talk, with short practice rounds in pairs.'),
  ('org-pg', 'Editing Phone Photos', 'PGN Building, Room 305', '2026-10-13T08:00:00Z', 30,
   'Free apps only. Cropping, light, and colour, using photos from the golden hour walk.'),
  ('org-rc', 'Robot Race Finals', 'Covered Court', '2026-10-16T07:30:00Z', 150,
   'The line-follower teams race on a new track. Seats are for spectators; teams register separately with the club.'),
  ('org-kc', 'Sisig and Stories Night', 'Canteen Annex', '2026-10-17T10:00:00Z', 45,
   'Members share family recipes and the stories behind them. Food is served, so the headcount has to be real.');

-- Approved seats held by the wider student body. The counts leave one event
-- full, three with a single seat left, and the rest open.
INSERT INTO reservations (event_id, student_id, status, decided_at)
SELECT e.id, s.id, 'approved', now() - interval '3 days'
FROM events e
JOIN (VALUES
  ('Intro to Web Accessibility', 16),
  ('Open Parliamentary Debate Night', 29),
  ('Golden Hour Photo Walk', 12),
  ('Line-Follower Robot Build', 23),
  ('Kapampangan Language Circle', 8),
  ('Git Rescue Clinic', 20),
  ('Public Speaking Basics', 33),
  ('Editing Phone Photos', 5),
  ('Robot Race Finals', 61),
  ('Sisig and Stories Night', 43)
) AS held (title, seats) ON held.title = e.title
JOIN LATERAL (
  SELECT id FROM students WHERE student_no LIKE '2025%' ORDER BY id LIMIT held.seats
) AS s ON TRUE;

-- Seats and requests belonging to the students in the picker, so My seats and
-- the officer queue both have something in them on a fresh database.
INSERT INTO reservations (event_id, student_id, status, decided_at)
SELECT e.id, s.id, r.status, CASE WHEN r.status = 'approved' THEN now() - interval '2 days' END
FROM (VALUES
  ('Intro to Web Accessibility',      'bea.manalo@student.hau.edu.ph',     'approved'),
  ('Kapampangan Language Circle',     'bea.manalo@student.hau.edu.ph',     'approved'),
  ('Git Rescue Clinic',               'bea.manalo@student.hau.edu.ph',     'pending'),
  ('Golden Hour Photo Walk',          'carlo.dizon@student.hau.edu.ph',    'approved'),
  ('Open Parliamentary Debate Night', 'carlo.dizon@student.hau.edu.ph',    'pending'),
  ('Line-Follower Robot Build',       'jasmine.pineda@student.hau.edu.ph', 'pending'),
  ('Public Speaking Basics',          'miguel.santos@student.hau.edu.ph',  'pending'),
  ('Editing Phone Photos',            'andrea.lacson@student.hau.edu.ph',  'pending')
) AS r (title, email, status)
JOIN events e ON e.title = r.title
JOIN students s ON s.email = r.email;
