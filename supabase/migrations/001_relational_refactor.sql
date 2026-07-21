-- ============================================================================
-- LENTERA APPS - Database Migration v2.0
-- Relational Database Refactor
-- ============================================================================
-- Jalankan SQL ini di Supabase Dashboard → SQL Editor
-- ============================================================================

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 0: CLEANUP PREVIOUS MIGRATION ATTEMPTS                               ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DROP TABLE IF EXISTS public.session_participants CASCADE;
DROP TABLE IF EXISTS public.live_sessions CASCADE;
DROP TABLE IF EXISTS public.teacher_subjects CASCADE;
DROP TABLE IF EXISTS public.teacher_classes CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.grades CASCADE;
DROP TABLE IF EXISTS public.teachers CASCADE;
DROP TABLE IF EXISTS public.schools CASCADE;
DROP TYPE IF EXISTS public.school_type_enum CASCADE;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 0.5: ENABLE EXTENSIONS                                               ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- Enable trigram extension for fuzzy search BEFORE using it in indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 1: CREATE ENUM                                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

CREATE TYPE public.school_type_enum AS ENUM ('SD', 'SMP', 'SMA', 'SMK', 'SLB');

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 2: CREATE TABLES                                                     ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ── 1. schools ─────────────────────────────────────────────────────────────────
CREATE TABLE public.schools (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT NOT NULL,
  school_type school_type_enum NOT NULL,
  address     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT schools_name_not_empty CHECK (char_length(trim(school_name)) > 0)
);

COMMENT ON TABLE public.schools IS 'Daftar sekolah yang terdaftar di Lentera';

CREATE INDEX idx_schools_type ON public.schools (school_type);
CREATE INDEX idx_schools_name ON public.schools USING gin (school_name gin_trgm_ops);

-- ── 2. grades ──────────────────────────────────────────────────────────────────
CREATE TABLE public.grades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_type school_type_enum NOT NULL,
  grade_name  TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,

  CONSTRAINT grades_unique UNIQUE (school_type, grade_name)
);

COMMENT ON TABLE public.grades IS 'Tingkatan kelas per jenis sekolah (SD 1-6, SMP VII-IX, dll)';

CREATE INDEX idx_grades_school_type ON public.grades (school_type, sort_order);

-- ── 3. classes ─────────────────────────────────────────────────────────────────
CREATE TABLE public.classes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id  UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  grade_id   UUID NOT NULL REFERENCES public.grades(id) ON DELETE RESTRICT,
  class_name TEXT NOT NULL,
  room_code  TEXT UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT classes_unique UNIQUE (school_id, grade_id, class_name),
  CONSTRAINT classes_name_not_empty CHECK (char_length(trim(class_name)) > 0)
);

COMMENT ON TABLE public.classes IS 'Kelas per sekolah per tingkat (VII-A, X IPA 1, dll)';

CREATE INDEX idx_classes_school_grade ON public.classes (school_id, grade_id);
CREATE UNIQUE INDEX idx_classes_room_code ON public.classes (room_code) WHERE room_code IS NOT NULL;

-- ── 4. teachers ────────────────────────────────────────────────────────────────
CREATE TABLE public.teachers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id    UUID NOT NULL REFERENCES public.schools(id) ON DELETE RESTRICT,
  full_name    TEXT NOT NULL,
  email        TEXT NOT NULL,
  nip          TEXT,
  is_verified  BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT teachers_name_not_empty CHECK (char_length(trim(full_name)) > 0),
  CONSTRAINT teachers_email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE public.teachers IS 'Profil guru yang terdaftar';

CREATE INDEX idx_teachers_auth_user ON public.teachers (auth_user_id);
CREATE INDEX idx_teachers_school ON public.teachers (school_id);

-- ── 5. teacher_classes (junction) ──────────────────────────────────────────────
CREATE TABLE public.teacher_classes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id   UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,

  CONSTRAINT teacher_classes_unique UNIQUE (teacher_id, class_id)
);

COMMENT ON TABLE public.teacher_classes IS 'Relasi guru-kelas (1 guru bisa mengajar banyak kelas)';

CREATE INDEX idx_tc_teacher ON public.teacher_classes (teacher_id);
CREATE INDEX idx_tc_class ON public.teacher_classes (class_id);

-- ── 6. subjects ────────────────────────────────────────────────────────────────
CREATE TABLE public.subjects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_name TEXT NOT NULL UNIQUE,
  is_custom    BOOLEAN NOT NULL DEFAULT false,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT subjects_name_not_empty CHECK (char_length(trim(subject_name)) > 0)
);

COMMENT ON TABLE public.subjects IS 'Daftar mata pelajaran (seed + custom)';

CREATE INDEX idx_subjects_name ON public.subjects (subject_name);

-- ── 7. teacher_subjects (junction) ─────────────────────────────────────────────
CREATE TABLE public.teacher_subjects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,

  CONSTRAINT teacher_subjects_unique UNIQUE (teacher_id, subject_id)
);

COMMENT ON TABLE public.teacher_subjects IS 'Relasi guru-mapel (1 guru bisa mengajar banyak mapel)';

CREATE INDEX idx_ts_teacher ON public.teacher_subjects (teacher_id);
CREATE INDEX idx_ts_subject ON public.teacher_subjects (subject_id);

-- ── 8. students ────────────────────────────────────────────────────────────────
CREATE TABLE public.students (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  absen      TEXT NOT NULL DEFAULT '0',
  class_id   UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT students_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT students_unique_absen_per_class UNIQUE (class_id, absen)
);

COMMENT ON TABLE public.students IS 'Siswa yang bergabung ke kelas (tanpa auth, join via room code)';

CREATE INDEX idx_students_class ON public.students (class_id);

-- ── 9. live_sessions ───────────────────────────────────────────────────────────
CREATE TABLE public.live_sessions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id         UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id           UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  subject_id         UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  room_code          TEXT NOT NULL,
  is_active          BOOLEAN NOT NULL DEFAULT true,
  transcript         TEXT DEFAULT '',
  interim_transcript TEXT DEFAULT '',
  language           TEXT NOT NULL DEFAULT 'id',
  started_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at           TIMESTAMPTZ,

  CONSTRAINT live_sessions_room_code_not_empty CHECK (char_length(trim(room_code)) > 0)
);

COMMENT ON TABLE public.live_sessions IS 'Sesi live yang sedang/pernah berlangsung';

CREATE INDEX idx_live_active ON public.live_sessions (is_active) WHERE is_active = true;
CREATE INDEX idx_live_room_code ON public.live_sessions (room_code);
CREATE INDEX idx_live_teacher ON public.live_sessions (teacher_id);

-- ── 10. session_participants ───────────────────────────────────────────────────
CREATE TABLE public.session_participants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT session_participants_unique UNIQUE (session_id, student_id)
);

COMMENT ON TABLE public.session_participants IS 'Siswa yang bergabung ke sesi live';

CREATE INDEX idx_sp_session ON public.session_participants (session_id);
CREATE INDEX idx_sp_student ON public.session_participants (student_id);

-- ── 11. session_history ────────────────────────────────────────────────────────
CREATE TABLE public.session_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  class_id        UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  subject_id      UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  -- Denormalized display columns (so history survives if class/subject is deleted)
  teacher_name    TEXT NOT NULL,
  class_display   TEXT NOT NULL,
  subject_display TEXT NOT NULL,
  language        TEXT NOT NULL DEFAULT 'id',
  duration        INT NOT NULL DEFAULT 0,
  word_count      INT NOT NULL DEFAULT 0,
  excerpt         TEXT NOT NULL DEFAULT '',
  transcript_full TEXT,
  session_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.session_history IS 'Riwayat sesi yang sudah selesai';

CREATE INDEX idx_history_teacher ON public.session_history (teacher_id);
CREATE INDEX idx_history_date ON public.session_history (session_date DESC);
CREATE INDEX idx_history_class ON public.session_history (class_id);

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 3: HELPER FUNCTIONS                                                  ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- Function to generate a unique room code for a class
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-char alphanumeric code
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    -- Check uniqueness
    SELECT EXISTS(SELECT 1 FROM public.classes WHERE room_code = code) INTO exists;
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate room_code on class insert
CREATE OR REPLACE FUNCTION public.auto_room_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.room_code IS NULL THEN
    NEW.room_code := public.generate_room_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_classes_room_code
  BEFORE INSERT ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_room_code();

-- Function to get teacher_id from auth.uid()
CREATE OR REPLACE FUNCTION public.get_teacher_id()
RETURNS UUID AS $$
  SELECT id FROM public.teachers WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 4: ROW LEVEL SECURITY (RLS)                                         ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- Enable RLS on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_history ENABLE ROW LEVEL SECURITY;

-- ── schools ────────────────────────────────────────────────────────────────────
CREATE POLICY "schools_select_all" ON public.schools
  FOR SELECT USING (true);

CREATE POLICY "schools_insert_all" ON public.schools
  FOR INSERT WITH CHECK (true);

CREATE POLICY "schools_update_authenticated" ON public.schools
  FOR UPDATE TO authenticated
  USING (true);

-- ── grades (read-only reference data) ──────────────────────────────────────────
CREATE POLICY "grades_select_all" ON public.grades
  FOR SELECT USING (true);

-- ── classes ────────────────────────────────────────────────────────────────────
CREATE POLICY "classes_select_authenticated" ON public.classes
  FOR SELECT TO authenticated
  USING (true);

-- Allow anon to read classes (students need to look up room codes)
CREATE POLICY "classes_select_anon" ON public.classes
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "classes_insert_all" ON public.classes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "classes_update_creator" ON public.classes
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

-- ── teachers ───────────────────────────────────────────────────────────────────
CREATE POLICY "teachers_select_own" ON public.teachers
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "teachers_insert_own" ON public.teachers
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "teachers_update_own" ON public.teachers
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid());

-- ── teacher_classes ────────────────────────────────────────────────────────────
CREATE POLICY "tc_select_own" ON public.teacher_classes
  FOR SELECT TO authenticated
  USING (teacher_id = public.get_teacher_id());

CREATE POLICY "tc_insert_own" ON public.teacher_classes
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = public.get_teacher_id());

CREATE POLICY "tc_delete_own" ON public.teacher_classes
  FOR DELETE TO authenticated
  USING (teacher_id = public.get_teacher_id());

-- ── subjects ───────────────────────────────────────────────────────────────────
CREATE POLICY "subjects_select_all" ON public.subjects
  FOR SELECT USING (true);

CREATE POLICY "subjects_insert_authenticated" ON public.subjects
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── teacher_subjects ───────────────────────────────────────────────────────────
CREATE POLICY "ts_select_own" ON public.teacher_subjects
  FOR SELECT TO authenticated
  USING (teacher_id = public.get_teacher_id());

CREATE POLICY "ts_insert_own" ON public.teacher_subjects
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = public.get_teacher_id());

CREATE POLICY "ts_delete_own" ON public.teacher_subjects
  FOR DELETE TO authenticated
  USING (teacher_id = public.get_teacher_id());

-- ── students ───────────────────────────────────────────────────────────────────
CREATE POLICY "students_select_authenticated" ON public.students
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "students_select_anon" ON public.students
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "students_insert_all" ON public.students
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "students_update_all" ON public.students
  FOR UPDATE
  USING (true);

-- ── live_sessions ──────────────────────────────────────────────────────────────
CREATE POLICY "live_select_authenticated" ON public.live_sessions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "live_select_anon" ON public.live_sessions
  FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "live_insert_teacher" ON public.live_sessions
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = public.get_teacher_id());

CREATE POLICY "live_update_teacher" ON public.live_sessions
  FOR UPDATE TO authenticated
  USING (teacher_id = public.get_teacher_id());

CREATE POLICY "live_delete_teacher" ON public.live_sessions
  FOR DELETE TO authenticated
  USING (teacher_id = public.get_teacher_id());

-- ── session_participants ───────────────────────────────────────────────────────
CREATE POLICY "sp_select_all" ON public.session_participants
  FOR SELECT USING (true);

CREATE POLICY "sp_insert_all" ON public.session_participants
  FOR INSERT
  WITH CHECK (true);

-- ── session_history ────────────────────────────────────────────────────────────
CREATE POLICY "history_select_own" ON public.session_history
  FOR SELECT TO authenticated
  USING (teacher_id = public.get_teacher_id());

CREATE POLICY "history_insert_teacher" ON public.session_history
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = public.get_teacher_id());

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 5: SEED DATA                                                         ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ── Seed grades ────────────────────────────────────────────────────────────────
INSERT INTO public.grades (school_type, grade_name, sort_order) VALUES
  -- SD
  ('SD', '1', 1), ('SD', '2', 2), ('SD', '3', 3),
  ('SD', '4', 4), ('SD', '5', 5), ('SD', '6', 6),
  -- SMP
  ('SMP', 'VII', 1), ('SMP', 'VIII', 2), ('SMP', 'IX', 3),
  -- SMA
  ('SMA', 'X', 1), ('SMA', 'XI', 2), ('SMA', 'XII', 3),
  -- SMK
  ('SMK', 'X', 1), ('SMK', 'XI', 2), ('SMK', 'XII', 3),
  -- SLB
  ('SLB', 'SDLB', 1), ('SLB', 'SMPLB', 2), ('SLB', 'SMALB', 3)
ON CONFLICT (school_type, grade_name) DO NOTHING;

-- ── Seed subjects ──────────────────────────────────────────────────────────────
INSERT INTO public.subjects (subject_name, is_custom) VALUES
  ('Matematika', false),
  ('IPA', false),
  ('IPS', false),
  ('Bahasa Indonesia', false),
  ('Bahasa Inggris', false),
  ('Fisika', false),
  ('Kimia', false),
  ('Biologi', false),
  ('Ekonomi', false),
  ('Sejarah', false),
  ('PKN', false),
  ('Seni Budaya', false),
  ('PJOK', false),
  ('Informatika', false),
  ('Bahasa Daerah', false),
  ('Agama', false),
  ('Prakarya', false),
  ('Geografi', false),
  ('Sosiologi', false),
  ('Bahasa Jepang', false),
  ('Bahasa Arab', false),
  ('Bahasa Mandarin', false)
ON CONFLICT (subject_name) DO NOTHING;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 6: DATA MIGRATION (from old tables)                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- This migration script moves data from the old flat tables (profiles, sessions, 
-- active_sessions) to the new relational structure. Run this AFTER the tables above
-- are created.

-- Step 6a: Migrate teacher profiles → schools + teachers
DO $$
DECLARE
  rec RECORD;
  v_school_id UUID;
  v_teacher_id UUID;
BEGIN
  FOR rec IN
    SELECT id, email, name, school, role
    FROM public.profiles
    WHERE role = 'teacher' AND name IS NOT NULL
  LOOP
    -- Skip if teacher already migrated
    IF EXISTS (SELECT 1 FROM public.teachers WHERE auth_user_id = rec.id) THEN
      CONTINUE;
    END IF;

    -- Create or find school
    IF rec.school IS NOT NULL AND trim(rec.school) != '' THEN
      SELECT id INTO v_school_id
      FROM public.schools
      WHERE lower(trim(school_name)) = lower(trim(rec.school))
      LIMIT 1;

      IF v_school_id IS NULL THEN
        INSERT INTO public.schools (school_name, school_type)
        VALUES (trim(rec.school), 'SMA')  -- Default to SMA, can be updated later
        RETURNING id INTO v_school_id;
      END IF;
    ELSE
      -- Create placeholder school
      SELECT id INTO v_school_id
      FROM public.schools
      WHERE school_name = 'Sekolah Belum Diatur'
      LIMIT 1;

      IF v_school_id IS NULL THEN
        INSERT INTO public.schools (school_name, school_type)
        VALUES ('Sekolah Belum Diatur', 'SMA')
        RETURNING id INTO v_school_id;
      END IF;
    END IF;

    -- Create teacher
    INSERT INTO public.teachers (auth_user_id, school_id, full_name, email)
    VALUES (rec.id, v_school_id, rec.name, rec.email)
    RETURNING id INTO v_teacher_id;

    RAISE NOTICE 'Migrated teacher: % (auth_user_id: %)', rec.name, rec.id;
  END LOOP;
END;
$$;

-- Step 6b: Migrate old sessions → session_history
DO $$
DECLARE
  rec RECORD;
  v_teacher_id UUID;
BEGIN
  FOR rec IN
    SELECT s.*, p.name as teacher_display_name
    FROM public.sessions s
    LEFT JOIN public.profiles p ON s.teacher_id = p.id
  LOOP
    -- Find teacher in new table
    SELECT id INTO v_teacher_id
    FROM public.teachers
    WHERE auth_user_id = rec.teacher_id;

    INSERT INTO public.session_history (
      teacher_id, teacher_name, class_display, subject_display,
      language, duration, word_count, excerpt, transcript_full,
      session_date, created_at
    ) VALUES (
      v_teacher_id,
      COALESCE(rec.teacher_display_name, rec.teacher_name, 'Unknown'),
      COALESCE(rec.class_name, 'Unknown'),
      COALESCE(rec.subject, 'Unknown'),
      COALESCE(rec.language, 'id'),
      COALESCE(rec.duration, 0),
      COALESCE(rec.word_count, 0),
      COALESCE(rec.excerpt, ''),
      rec.transcript_full,
      COALESCE(rec.date::date, CURRENT_DATE),
      COALESCE(rec.created_at::timestamptz, now())
    );
  END LOOP;
END;
$$;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 7: EXAMPLE QUERIES                                                  ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- Query 1: Get grades for a school type
-- SELECT * FROM grades WHERE school_type = 'SMP' ORDER BY sort_order;

-- Query 2: Get classes for a school + grade
-- SELECT c.*, g.grade_name 
-- FROM classes c
-- JOIN grades g ON c.grade_id = g.id
-- WHERE c.school_id = 'xxx' AND c.grade_id = 'yyy';

-- Query 3: Get teacher's classes with full info
-- SELECT c.id, c.class_name, c.room_code, g.grade_name, s.school_name
-- FROM teacher_classes tc
-- JOIN classes c ON tc.class_id = c.id
-- JOIN grades g ON c.grade_id = g.id
-- JOIN schools s ON c.school_id = s.id
-- WHERE tc.teacher_id = 'xxx';

-- Query 4: Get teacher's subjects
-- SELECT s.id, s.subject_name
-- FROM teacher_subjects ts
-- JOIN subjects s ON ts.subject_id = s.id
-- WHERE ts.teacher_id = 'xxx';

-- Query 5: Get students in a class
-- SELECT st.id, st.name, st.absen, c.class_name, g.grade_name
-- FROM students st
-- JOIN classes c ON st.class_id = c.id
-- JOIN grades g ON c.grade_id = g.id
-- WHERE st.class_id = 'xxx'
-- ORDER BY st.absen::int;
