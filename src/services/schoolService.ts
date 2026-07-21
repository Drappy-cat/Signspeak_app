// ============================================================================
// LENTERA APPS - School Service
// CRUD & query functions for schools, grades, classes
// ============================================================================

import { db } from './supabase';
import type {
  School, SchoolInsert, SchoolType,
  Grade,
  Class, ClassInsert, ClassWithDetails,
} from '../types/database';

// ── Schools ──────────────────────────────────────────────────────────────────

/** Search schools by name (fuzzy search) */
export async function searchSchools(query: string, typeFilter?: SchoolType | null, limit = 50): Promise<School[]> {
  let q = db.from('schools').select('*');

  if (typeFilter) {
    q = q.eq('school_type', typeFilter);
  }

  if (query.trim()) {
    const words = query.trim().split(/\s+/);
    words.forEach(word => {
      // Setiap kata yang diketik HARUS ada di dalam school_name ATAU address
      q = q.or(`school_name.ilike.%${word}%,address.ilike.%${word}%`);
    });
  }

  const { data, error } = await q
    .order('school_name')
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as School[];
}

/** Get all schools (for browsing) */
export async function getAllSchools(): Promise<School[]> {
  const { data, error } = await db
    .from('schools')
    .select('*')
    .order('school_name');

  if (error) throw error;
  return (data ?? []) as School[];
}

/** Get school by ID */
export async function getSchoolById(id: string): Promise<School | null> {
  const { data, error } = await db
    .from('schools')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as School | null;
}

/** Create a new school */
export async function createSchool(school: SchoolInsert): Promise<School> {
  const { data, error } = await db
    .from('schools')
    .insert(school as any)
    .select()
    .single();

  if (error) throw error;
  return data as School;
}

/** Check if school exists by name (case-insensitive) */
export async function findSchoolByName(name: string): Promise<School | null> {
  const { data, error } = await db
    .from('schools')
    .select('*')
    .ilike('school_name', name.trim())
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as School | null;
}

// ── Grades ───────────────────────────────────────────────────────────────────

/** Get grades by school type — this is the key "smart dropdown" query */
export async function getGradesBySchoolType(schoolType: SchoolType): Promise<Grade[]> {
  const { data, error } = await db
    .from('grades')
    .select('*')
    .eq('school_type', schoolType)
    .order('sort_order');

  if (error) throw error;
  return (data ?? []) as Grade[];
}

/** Get all grades */
export async function getAllGrades(): Promise<Grade[]> {
  const { data, error } = await db
    .from('grades')
    .select('*')
    .order('school_type')
    .order('sort_order');

  if (error) throw error;
  return (data ?? []) as Grade[];
}

// ── Classes ──────────────────────────────────────────────────────────────────

/** Get classes for a specific school + grade */
export async function getClassesBySchoolAndGrade(
  schoolId: string,
  gradeId: string
): Promise<ClassWithDetails[]> {
  const { data, error } = await db
    .from('classes')
    .select('*, grade:grades(*), school:schools(*)')
    .eq('school_id', schoolId)
    .eq('grade_id', gradeId)
    .order('class_name');

  if (error) throw error;
  return (data ?? []) as ClassWithDetails[];
}

/** Get all classes for a school */
export async function getClassesBySchool(schoolId: string): Promise<ClassWithDetails[]> {
  const { data, error } = await db
    .from('classes')
    .select('*, grade:grades(*), school:schools(*)')
    .eq('school_id', schoolId)
    .order('class_name');

  if (error) throw error;
  return (data ?? []) as ClassWithDetails[];
}

/** Get class by room code (used by students to join) */
export async function getClassByRoomCode(roomCode: string): Promise<ClassWithDetails | null> {
  const { data, error } = await db
    .from('classes')
    .select('*, grade:grades(*), school:schools(*)')
    .eq('room_code', roomCode.trim().toUpperCase())
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as ClassWithDetails | null;
}

/** Create a new class (guru creates like Google Classroom) */
export async function createClass(classData: ClassInsert): Promise<Class> {
  const { data, error } = await db
    .from('classes')
    .insert(classData as any)
    .select()
    .single();

  if (error) throw error;
  return data as Class;
}

/** Get class by ID with details */
export async function getClassById(classId: string): Promise<ClassWithDetails | null> {
  const { data, error } = await db
    .from('classes')
    .select('*, grade:grades(*), school:schools(*)')
    .eq('id', classId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as ClassWithDetails | null;
}
