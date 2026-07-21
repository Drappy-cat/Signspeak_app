// ============================================================================
// LENTERA APPS - Admin Service
// ============================================================================
// Admin-level functions for dashboard analytics, user management,
// class management, and session monitoring.

import { db } from './supabase';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AdminMetrics {
  totalTeachers: number;
  totalSchools: number;
  totalClasses: number;
  activeSessions: number;
  totalSessions: number;
  totalStudents: number;
}

export interface TeacherRow {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  nip: string | null;
  is_verified: boolean;
  role: string;
  created_at: string;
  school?: { id: string; school_name: string; school_type: string; address: string | null };
}

export interface ClassRow {
  id: string;
  class_name: string;
  room_code: string | null;
  created_by: string | null;
  created_at: string;
  grade?: { id: string; grade_name: string; school_type: string };
  school?: { id: string; school_name: string; school_type: string; address: string | null };
}

export interface SessionRow {
  id: string;
  room_code: string;
  is_active: boolean;
  language: string;
  started_at: string;
  ended_at: string | null;
  teacher?: { id: string; full_name: string; email: string };
  class?: { id: string; class_name: string; school?: { school_name: string } };
  subject?: { id: string; subject_name: string };
}

export interface ProvinceStats {
  province: string;
  count: number;
}

// ── Admin Check ──────────────────────────────────────────────────────────────

/** Check if a user has admin role */
export async function checkIsAdmin(authUserId: string): Promise<boolean> {
  const { data, error } = await db
    .from('teachers')
    .select('role')
    .eq('auth_user_id', authUserId)
    .single();

  if (error || !data) return false;
  return data.role === 'admin';
}

// ── Dashboard Metrics ────────────────────────────────────────────────────────

/** Get overall platform metrics */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  // Run all counts in parallel
  const [teachers, schools, classes, activeSessions, allSessions, students] = await Promise.all([
    db.from('teachers').select('id', { count: 'exact', head: true }),
    db.from('schools').select('id', { count: 'exact', head: true }),
    db.from('classes').select('id', { count: 'exact', head: true }),
    db.from('live_sessions').select('id', { count: 'exact', head: true }).eq('is_active', true),
    db.from('session_history').select('id', { count: 'exact', head: true }),
    db.from('students').select('id', { count: 'exact', head: true }),
  ]);

  return {
    totalTeachers: teachers.count ?? 0,
    totalSchools: schools.count ?? 0,
    totalClasses: classes.count ?? 0,
    activeSessions: activeSessions.count ?? 0,
    totalSessions: allSessions.count ?? 0,
    totalStudents: students.count ?? 0,
  };
}

// ── Regional Analytics ───────────────────────────────────────────────────────

/** Get teacher distribution by province (parsed from school address) */
export async function getProvinceDistribution(): Promise<ProvinceStats[]> {
  const { data, error } = await db
    .from('teachers')
    .select('school:schools(address)')
    .not('school_id', 'is', null);

  if (error || !data) return [];

  const provinceCounts: Record<string, number> = {};

  for (const teacher of data) {
    const address = (teacher as any).school?.address;
    if (!address) continue;
    
    const match = address.match(/Prov\.\s+([^,]+)/i);
    if (match) {
      const province = match[1].trim();
      provinceCounts[province] = (provinceCounts[province] || 0) + 1;
    }
  }

  return Object.entries(provinceCounts)
    .map(([province, count]) => ({ province, count }))
    .sort((a, b) => b.count - a.count);
}

// ── User Management ──────────────────────────────────────────────────────────

/** Get all teachers with school info */
export async function getAllTeachers(): Promise<TeacherRow[]> {
  const { data, error } = await db
    .from('teachers')
    .select('*, school:schools(id, school_name, school_type, address)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as TeacherRow[];
}

/** Verify or unverify a teacher */
export async function setTeacherVerified(teacherId: string, verified: boolean): Promise<void> {
  const { error } = await db
    .from('teachers')
    .update({ is_verified: verified })
    .eq('id', teacherId);

  if (error) throw error;
}

/** Set teacher role */
export async function setTeacherRole(teacherId: string, role: 'teacher' | 'admin'): Promise<void> {
  const { error } = await db
    .from('teachers')
    .update({ role })
    .eq('id', teacherId);

  if (error) throw error;
}

/** Delete a teacher */
export async function deleteTeacher(teacherId: string): Promise<void> {
  const { error } = await db
    .from('teachers')
    .delete()
    .eq('id', teacherId);

  if (error) throw error;
}

// ── Class Management ─────────────────────────────────────────────────────────

/** Get all classes with school and grade info */
export async function getAllClasses(limit = 100, offset = 0): Promise<{ data: ClassRow[]; total: number }> {
  const { data, error, count } = await db
    .from('classes')
    .select('*, grade:grades(id, grade_name, school_type), school:schools(id, school_name, school_type, address)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data: (data ?? []) as ClassRow[], total: count ?? 0 };
}

/** Delete a class by ID */
export async function deleteClass(classId: string): Promise<void> {
  const { error } = await db
    .from('classes')
    .delete()
    .eq('id', classId);

  if (error) throw error;
}

/** Create a class (admin can create for any school) */
export async function adminCreateClass(data: {
  school_id: string;
  grade_id: string;
  class_name: string;
  created_by?: string | null;
}): Promise<ClassRow> {
  const { data: result, error } = await db
    .from('classes')
    .insert(data)
    .select('*, grade:grades(id, grade_name, school_type), school:schools(id, school_name, school_type, address)')
    .single();

  if (error) throw error;
  return result as ClassRow;
}

// ── Session Monitoring ───────────────────────────────────────────────────────

/** Get recent sessions (active + recent history) */
export async function getRecentSessions(limit = 50): Promise<SessionRow[]> {
  const { data, error } = await db
    .from('live_sessions')
    .select('*, teacher:teachers(id, full_name, email), class:classes(id, class_name, school:schools(school_name)), subject:subjects(id, subject_name)')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as SessionRow[];
}

/** Get session history with aggregated stats */
export async function getSessionHistory(limit = 50): Promise<any[]> {
  const { data, error } = await db
    .from('session_history')
    .select('*')
    .order('session_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
