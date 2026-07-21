// ============================================================================
// LENTERA APPS - Database Types (Relational Schema v2.0)
// ============================================================================

// ── Enums ────────────────────────────────────────────────────────────────────

export type SchoolType = 'SD' | 'SMP' | 'SMA' | 'SMK' | 'SLB';

// ── Core Tables ──────────────────────────────────────────────────────────────

export interface School {
  id: string;
  school_name: string;
  school_type: SchoolType;
  address: string | null;
  created_at: string;
}

export interface Grade {
  id: string;
  school_type: SchoolType;
  grade_name: string;
  sort_order: number;
}

export interface Class {
  id: string;
  school_id: string;
  grade_id: string;
  class_name: string;
  room_code: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Teacher {
  id: string;
  auth_user_id: string;
  school_id: string;
  full_name: string;
  email: string;
  nip: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface Subject {
  id: string;
  subject_name: string;
  is_custom: boolean;
  created_by: string | null;
}

export interface Student {
  id: string;
  name: string;
  absen: string;
  class_id: string;
  created_at: string;
}

// ── Junction Tables ──────────────────────────────────────────────────────────

export interface TeacherClass {
  id: string;
  teacher_id: string;
  class_id: string;
}

export interface TeacherSubject {
  id: string;
  teacher_id: string;
  subject_id: string;
}

// ── Session Tables ───────────────────────────────────────────────────────────

export interface LiveSession {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  room_code: string;
  is_active: boolean;
  transcript: string | null;
  interim_transcript: string | null;
  language: string;
  started_at: string;
  ended_at: string | null;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  student_id: string;
  joined_at: string;
}

export interface SessionHistory {
  id: string;
  teacher_id: string | null;
  class_id: string | null;
  subject_id: string | null;
  teacher_name: string;
  class_display: string;
  subject_display: string;
  language: string;
  duration: number;
  word_count: number;
  excerpt: string;
  transcript_full: string | null;
  session_date: string;
  created_at: string;
}

// ── Joined / Enriched Types ──────────────────────────────────────────────────

/** Class with grade and school info joined */
export interface ClassWithDetails extends Class {
  grade?: Grade;
  school?: School;
}

/** Teacher with school info joined */
export interface TeacherWithSchool extends Teacher {
  school?: School;
}

/** Teacher class with full class + grade + school info */
export interface TeacherClassWithDetails extends TeacherClass {
  class?: ClassWithDetails;
}

/** Teacher subject with subject name */
export interface TeacherSubjectWithDetails extends TeacherSubject {
  subject?: Subject;
}

/** Full teacher profile with all relations */
export interface TeacherProfile {
  teacher: Teacher;
  school: School;
  classes: ClassWithDetails[];
  subjects: Subject[];
}

// ── Insert Types ─────────────────────────────────────────────────────────────

export type SchoolInsert = Omit<School, 'id' | 'created_at'>;
export type ClassInsert = Omit<Class, 'id' | 'room_code' | 'created_at'>;
export type TeacherInsert = Omit<Teacher, 'id' | 'created_at' | 'is_verified'>;
export type StudentInsert = Omit<Student, 'id' | 'created_at'>;
export type SubjectInsert = Pick<Subject, 'subject_name' | 'is_custom' | 'created_by'>;
export type LiveSessionInsert = Omit<LiveSession, 'id' | 'started_at' | 'ended_at' | 'transcript' | 'interim_transcript'>;
export type SessionHistoryInsert = Omit<SessionHistory, 'id' | 'created_at'>;
