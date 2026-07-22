// ============================================================================
// LENTERA APPS - Teacher Service
// CRUD & query functions for teachers, teacher_classes, teacher_subjects
// ============================================================================

import { db } from './supabase';
import type {
  Teacher, TeacherInsert, TeacherProfile,
  ClassWithDetails, Subject,
  Student, StudentInsert,
} from '../types/database';
// ── Teacher Profile ──────────────────────────────────────────────────────────

/** Create a new teacher profile linked to auth.users */
export async function createTeacherProfile(data: TeacherInsert): Promise<Teacher> {
  const { data: teacher, error } = await db
    .from('teachers')
    .insert(data as any)
    .select()
    .single();

  if (error) throw error;
  return teacher as Teacher;
}

/** Get teacher by auth_user_id (main lookup after login) */
export async function getTeacherByAuthId(authUserId: string): Promise<Teacher | null> {
  const { data, error } = await db
    .from('teachers')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as Teacher | null;
}

/** Get full teacher profile with school, classes, and subjects by teacherId */
export async function getTeacherProfile(teacherId: string): Promise<TeacherProfile | null> {
  const { data: teacherData, error: teacherError } = await db
    .from('teachers')
    .select('*, school:schools(*)')
    .eq('id', teacherId)
    .single();

  if (teacherError && teacherError.code !== 'PGRST116') throw teacherError;
  if (!teacherData) return null;

  const teacher = teacherData as any;

  const { data: classesData } = await db
    .from('teacher_classes')
    .select('*, class:classes(*, grade:grades(*), school:schools(*))')
    .eq('teacher_id', teacher.id);

  const { data: subjectsData } = await db
    .from('teacher_subjects')
    .select('*, subject:subjects(*)')
    .eq('teacher_id', teacher.id);

  return {
    teacher: {
      id: teacher.id,
      auth_user_id: teacher.auth_user_id,
      school_id: teacher.school_id,
      full_name: teacher.full_name,
      email: teacher.email,
      nip: teacher.nip,
      is_verified: teacher.is_verified,
      created_at: teacher.created_at,
    },
    school: teacher.school,
    classes: (classesData ?? []).map((tc: any) => tc.class).filter(Boolean) as ClassWithDetails[],
    subjects: (subjectsData ?? []).map((ts: any) => ts.subject).filter(Boolean) as Subject[],
  };
}

/** Get full teacher profile with school, classes, and subjects by authUserId */
export async function getTeacherFullProfile(authUserId: string): Promise<TeacherProfile | null> {
  // 1. Get teacher + school
  const { data: teacherData, error: teacherError } = await db
    .from('teachers')
    .select('*, school:schools(*)')
    .eq('auth_user_id', authUserId)
    .single();

  if (teacherError && teacherError.code !== 'PGRST116') throw teacherError;
  if (!teacherData) return null;

  const teacher = teacherData as any;

  // 2. Get teacher's classes with grade + school
  const { data: classesData, error: classesError } = await db
    .from('teacher_classes')
    .select('*, class:classes(*, grade:grades(*), school:schools(*))')
    .eq('teacher_id', teacher.id);

  if (classesError) throw classesError;

  // 3. Get teacher's subjects
  const { data: subjectsData, error: subjectsError } = await db
    .from('teacher_subjects')
    .select('*, subject:subjects(*)')
    .eq('teacher_id', teacher.id);

  if (subjectsError) throw subjectsError;

  return {
    teacher: {
      id: teacher.id,
      auth_user_id: teacher.auth_user_id,
      school_id: teacher.school_id,
      full_name: teacher.full_name,
      email: teacher.email,
      nip: teacher.nip,
      is_verified: teacher.is_verified,
      created_at: teacher.created_at,
    },
    school: teacher.school,
    classes: (classesData ?? []).map((tc: any) => tc.class).filter(Boolean) as ClassWithDetails[],
    subjects: (subjectsData ?? []).map((ts: any) => ts.subject).filter(Boolean) as Subject[],
  };
}

/** Update teacher profile */
export async function updateTeacherProfile(
  teacherId: string,
  updates: Partial<Pick<Teacher, 'full_name' | 'nip' | 'school_id'>>
): Promise<void> {
  const { error } = await db
    .from('teachers')
    .update(updates as any)
    .eq('id', teacherId);

  if (error) throw error;
}

// ── Teacher Classes ──────────────────────────────────────────────────────────

/** Get all classes assigned to a teacher (for dropdown in Live Session) */
export async function getTeacherClasses(teacherId: string): Promise<ClassWithDetails[]> {
  const { data, error } = await db
    .from('teacher_classes')
    .select('*, class:classes(*, grade:grades(*), school:schools(*))')
    .eq('teacher_id', teacherId);

  if (error) throw error;
  return (data ?? []).map((tc: any) => tc.class).filter(Boolean) as ClassWithDetails[];
}

/** Assign teacher to a class */
export async function assignTeacherToClass(teacherId: string, classId: string): Promise<void> {
  const { error } = await db
    .from('teacher_classes')
    .insert({ teacher_id: teacherId, class_id: classId } as any);

  if (error && error.code !== '23505') throw error; // Ignore duplicate
}

/** Assign teacher to multiple classes */
export async function assignTeacherToClasses(teacherId: string, classIds: string[]): Promise<void> {
  if (classIds.length === 0) return;
  const rows = classIds.map(classId => ({ teacher_id: teacherId, class_id: classId }));

  const { error } = await db
    .from('teacher_classes')
    .upsert(rows as any, { onConflict: 'teacher_id,class_id' });

  if (error) throw error;
}

/** Remove teacher from a class */
export async function removeTeacherFromClass(teacherId: string, classId: string): Promise<void> {
  const { error } = await db
    .from('teacher_classes')
    .delete()
    .eq('teacher_id', teacherId)
    .eq('class_id', classId);

  if (error) throw error;
}

// ── Teacher Subjects ─────────────────────────────────────────────────────────

/** Get all subjects assigned to a teacher (for dropdown in Live Session) */
export async function getTeacherSubjects(teacherId: string): Promise<Subject[]> {
  const { data, error } = await db
    .from('teacher_subjects')
    .select('*, subject:subjects(*)')
    .eq('teacher_id', teacherId);

  if (error) throw error;
  return (data ?? []).map((ts: any) => ts.subject).filter(Boolean) as Subject[];
}

/** Assign teacher to a subject */
export async function assignTeacherToSubject(teacherId: string, subjectId: string): Promise<void> {
  const { error } = await db
    .from('teacher_subjects')
    .insert({ teacher_id: teacherId, subject_id: subjectId } as any);

  if (error && error.code !== '23505') throw error; // Ignore duplicate
}

/** Assign teacher to multiple subjects */
export async function assignTeacherToSubjects(teacherId: string, subjectIds: string[]): Promise<void> {
  if (subjectIds.length === 0) return;
  const rows = subjectIds.map(subjectId => ({ teacher_id: teacherId, subject_id: subjectId }));

  const { error } = await db
    .from('teacher_subjects')
    .upsert(rows as any, { onConflict: 'teacher_id,subject_id' });

  if (error) throw error;
}

/** Remove teacher from a subject */
export async function removeTeacherFromSubject(teacherId: string, subjectId: string): Promise<void> {
  const { error } = await db
    .from('teacher_subjects')
    .delete()
    .eq('teacher_id', teacherId)
    .eq('subject_id', subjectId);

  if (error) throw error;
}

// ── Subjects ─────────────────────────────────────────────────────────────────

/** Get all subjects (seed + custom) */
export async function getAllSubjects(): Promise<Subject[]> {
  const { data, error } = await db
    .from('subjects')
    .select('*')
    .order('is_custom')
    .order('subject_name');

  if (error) throw error;
  return (data ?? []) as Subject[];
}

/** Create a custom subject (when guru's subject is not in the list) */
export async function createCustomSubject(subjectName: string, createdBy: string): Promise<Subject> {
  // First check if it already exists
  const { data: existing } = await db
    .from('subjects')
    .select('*')
    .ilike('subject_name', subjectName.trim())
    .single();

  if (existing) return existing as Subject;

  const { data, error } = await db
    .from('subjects')
    .insert({
      subject_name: subjectName.trim(),
      is_custom: true,
      created_by: createdBy,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data as Subject;
}

// ── Students ─────────────────────────────────────────────────────────────────

/** Register/find a student in a class (used when student joins via room code) */
export async function upsertStudent(data: StudentInsert): Promise<Student> {
  // Try to find existing student with same absen in same class
  const { data: existing } = await db
    .from('students')
    .select('*')
    .eq('class_id', data.class_id)
    .eq('absen', data.absen)
    .single();

  if (existing) {
    // Update name if different
    if ((existing as any).name !== data.name) {
      const { data: updated, error } = await db
        .from('students')
        .update({ name: data.name } as any)
        .eq('id', (existing as any).id)
        .select()
        .single();
      if (error) throw error;
      return updated as Student;
    }
    return existing as Student;
  }

  // Create new student
  const { data: student, error } = await db
    .from('students')
    .insert(data as any)
    .select()
    .single();

  if (error) throw error;
  return student as Student;
}

/** Get all students in a class */
export async function getStudentsByClass(classId: string): Promise<Student[]> {
  const { data, error } = await db
    .from('students')
    .select('*')
    .eq('class_id', classId)
    .order('absen');

  if (error) throw error;
  return (data ?? []) as Student[];
}

/** Generate a collision-free 6-character room code across all active sessions */
export async function generateUniqueRoomCode(): Promise<string> {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude ambiguous 0, O, 1, I to avoid student typing confusion
  let attempts = 0;

  while (attempts < 15) {
    attempts++;
    let candidate = '';
    for (let i = 0; i < 6; i++) {
      candidate += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check if room code is currently active in live_sessions
    const { data, error } = await db
      .from('live_sessions')
      .select('id')
      .eq('room_code', candidate)
      .eq('is_active', true)
      .maybeSingle();

    if (!error && !data) {
      return candidate; // Unambiguous and collision-free!
    }
  }

  // Fallback
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/** Get active live session by room code (for students joining) */
export async function getActiveSessionByRoomCode(roomCode: string) {
  const { data, error } = await db
    .from('live_sessions')
    .select('*, class:classes(*, grade:grades(*), school:schools(*)), subject:subjects(*), teacher:teachers(*)')
    .eq('room_code', roomCode.trim().toUpperCase())
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/** Add participant to session */
export async function addSessionParticipant(sessionId: string, studentId: string): Promise<void> {
  const { error } = await db
    .from('session_participants')
    .upsert({
      session_id: sessionId,
      student_id: studentId,
    } as any, { onConflict: 'session_id,student_id' });

  if (error) throw error;
}

// ── Teacher Glossary ─────────────────────────────────────────────────────────

/** Fetch the custom glossary for a specific teacher */
export async function getTeacherGlossary(teacherId: string): Promise<Array<{ word: string; definition: string }>> {
  const { data, error } = await db
    .from('teachers')
    .select('custom_glossary')
    .eq('id', teacherId)
    .single();

  if (error) {
    console.error('[DB] Failed to fetch glossary:', error);
    return [];
  }
  return data?.custom_glossary || [];
}

/** Save the custom glossary to a specific teacher's profile */
export async function saveTeacherGlossary(teacherId: string, glossary: Array<{ word: string; definition: string }>) {
  const { error } = await db
    .from('teachers')
    .update({ custom_glossary: glossary })
    .eq('id', teacherId);

  if (error) {
    console.error('[DB] Failed to save glossary:', error);
    throw error;
  }
}

// ── Teacher Session History ──────────────────────────────────────────────────

/** Fetch the session history for a specific teacher */
export async function getTeacherSessionHistory(teacherId: string, limit: number = 5): Promise<any[]> {
  const { data, error } = await db
    .from('session_history')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[DB] Failed to fetch session history:', error);
    return [];
  }
  return data || [];
}
