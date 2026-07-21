-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  MIGRATION 002: Admin Role & Analytics Support                            ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝
-- 
-- Adds admin role to teachers table for dashboard access.
-- Run this in Supabase SQL Editor.
--

-- ── 1. Add role column to teachers ──────────────────────────────────────────
ALTER TABLE public.teachers 
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'teacher'
  CHECK (role IN ('teacher', 'admin'));

COMMENT ON COLUMN public.teachers.role IS 'User role: teacher (default) or admin';

-- ── 2. Allow admin to delete classes ────────────────────────────────────────
CREATE POLICY "classes_delete_admin" ON public.classes
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── 3. Allow admin to update any class ──────────────────────────────────────
DROP POLICY IF EXISTS "classes_update_creator" ON public.classes;

CREATE POLICY "classes_update_owner_or_admin" ON public.classes
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.teachers 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── 4. Allow admin to read all teachers ─────────────────────────────────────
CREATE POLICY "teachers_select_admin" ON public.teachers
  FOR SELECT TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.teachers 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── 5. Allow admin to update any teacher (verify/deactivate) ────────────────
CREATE POLICY "teachers_update_admin" ON public.teachers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── 6. Allow admin to delete teachers ───────────────────────────────────────
CREATE POLICY "teachers_delete_admin" ON public.teachers
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── 7. Admin read all teacher_classes ───────────────────────────────────────
CREATE POLICY "tc_select_admin" ON public.teacher_classes
  FOR SELECT TO authenticated
  USING (
    teacher_id = public.get_teacher_id()
    OR EXISTS (
      SELECT 1 FROM public.teachers 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── 8. Admin read all students ──────────────────────────────────────────────
CREATE POLICY "students_select_admin" ON public.students
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── 9. Admin read all live sessions ─────────────────────────────────────────
CREATE POLICY "live_sessions_select_admin" ON public.live_sessions
  FOR SELECT TO authenticated
  USING (
    teacher_id = public.get_teacher_id()
    OR EXISTS (
      SELECT 1 FROM public.teachers 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── 10. Admin read all session history ──────────────────────────────────────
CREATE POLICY "session_history_select_admin" ON public.session_history
  FOR SELECT TO authenticated
  USING (
    teacher_id = public.get_teacher_id()
    OR EXISTS (
      SELECT 1 FROM public.teachers 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  HOW TO MAKE YOUR ACCOUNT AN ADMIN:                                        ║
-- ║                                                                            ║
-- ║  UPDATE public.teachers                                                    ║
-- ║  SET role = 'admin'                                                        ║
-- ║  WHERE email = 'your-email@gmail.com';                                     ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝
