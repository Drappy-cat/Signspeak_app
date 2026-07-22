-- Migration 005: Allow reading teacher profiles for active session display & store teacher_name in live_sessions

-- 1. Allow students (anon and authenticated) to view teacher profiles
DROP POLICY IF EXISTS "teachers_select_own" ON public.teachers;
DROP POLICY IF EXISTS "teachers_select_all" ON public.teachers;

CREATE POLICY "teachers_select_all" ON public.teachers
  FOR SELECT
  USING (true);

-- 2. Add teacher_name and teacher_school columns to live_sessions table for fast cached lookup
ALTER TABLE public.live_sessions 
ADD COLUMN IF NOT EXISTS teacher_name TEXT,
ADD COLUMN IF NOT EXISTS teacher_school TEXT;

COMMENT ON COLUMN public.live_sessions.teacher_name IS 'Nama lengkap guru pembuat sesi (cached)';
COMMENT ON COLUMN public.live_sessions.teacher_school IS 'Nama sekolah/instansi guru (cached)';
