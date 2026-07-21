-- ============================================================================
-- FIX: Prevent Infinite Recursion on Admin RLS Policies
-- ============================================================================

-- 1. Create a SECURITY DEFINER function to check admin status safely (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teachers 
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Fix policies for teachers table (This was causing the infinite recursion)
DROP POLICY IF EXISTS "teachers_select_admin" ON public.teachers;
CREATE POLICY "teachers_select_admin" ON public.teachers
  FOR SELECT TO authenticated
  USING (
    auth_user_id = auth.uid() OR public.is_admin()
  );

DROP POLICY IF EXISTS "teachers_update_admin" ON public.teachers;
CREATE POLICY "teachers_update_admin" ON public.teachers
  FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "teachers_delete_admin" ON public.teachers;
CREATE POLICY "teachers_delete_admin" ON public.teachers
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 3. Fix policies for classes table
DROP POLICY IF EXISTS "classes_delete_admin" ON public.classes;
CREATE POLICY "classes_delete_admin" ON public.classes
  FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "classes_update_owner_or_admin" ON public.classes;
CREATE POLICY "classes_update_owner_or_admin" ON public.classes
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() OR public.is_admin()
  );

-- 4. Fix policies for other tables
DROP POLICY IF EXISTS "tc_select_admin" ON public.teacher_classes;
CREATE POLICY "tc_select_admin" ON public.teacher_classes
  FOR SELECT TO authenticated
  USING (
    teacher_id = public.get_teacher_id() OR public.is_admin()
  );

DROP POLICY IF EXISTS "students_select_admin" ON public.students;
CREATE POLICY "students_select_admin" ON public.students
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "live_sessions_select_admin" ON public.live_sessions;
CREATE POLICY "live_sessions_select_admin" ON public.live_sessions
  FOR SELECT TO authenticated
  USING (
    teacher_id = public.get_teacher_id() OR public.is_admin()
  );

DROP POLICY IF EXISTS "session_history_select_admin" ON public.session_history;
CREATE POLICY "session_history_select_admin" ON public.session_history
  FOR SELECT TO authenticated
  USING (
    teacher_id = public.get_teacher_id() OR public.is_admin()
  );
