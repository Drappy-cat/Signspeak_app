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

export type SchoolSortBy = 'name' | 'prov' | 'kab' | 'kec';

export const INDONESIAN_PROVINCES = [
  'Aceh',
  'Bali',
  'Banten',
  'Bengkulu',
  'D.I. Yogyakarta',
  'D.K.I. Jakarta',
  'Gorontalo',
  'Jambi',
  'Jawa Barat',
  'Jawa Tengah',
  'Jawa Timur',
  'Kalimantan Barat',
  'Kalimantan Selatan',
  'Kalimantan Tengah',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Kepulauan Bangka Belitung',
  'Kepulauan Riau',
  'Lampung',
  'Maluku',
  'Maluku Utara',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Papua',
  'Papua Barat',
  'Papua Barat Daya',
  'Papua Pegunungan',
  'Papua Selatan',
  'Papua Tengah',
  'Riau',
  'Sulawesi Barat',
  'Sulawesi Selatan',
  'Sulawesi Tengah',
  'Sulawesi Tenggara',
  'Sulawesi Utara',
  'Sumatera Barat',
  'Sumatera Selatan',
  'Sumatera Utara',
];

const DEMO_FALLBACK_SCHOOLS: School[] = [
  { id: 'sch-1', school_name: 'SMKN 1 Surabaya', school_type: 'SMK', address: 'Prov. Jawa Timur, Kota Surabaya, Kec. Wonokromo', created_at: new Date().toISOString() },
  { id: 'sch-2', school_name: 'SMAN 5 Surabaya', school_type: 'SMA', address: 'Prov. Jawa Timur, Kota Surabaya, Kec. Genteng', created_at: new Date().toISOString() },
  { id: 'sch-3', school_name: 'SLBN 1 Surabaya', school_type: 'SLB', address: 'Prov. Jawa Timur, Kota Surabaya, Kec. Gayungan', created_at: new Date().toISOString() },
  { id: 'sch-4', school_name: 'SMPN 1 Surabaya', school_type: 'SMP', address: 'Prov. Jawa Timur, Kota Surabaya, Kec. Tegalsari', created_at: new Date().toISOString() },
  { id: 'sch-5', school_name: 'SDN Ketabang 1 Surabaya', school_type: 'SD', address: 'Prov. Jawa Timur, Kota Surabaya, Kec. Genteng', created_at: new Date().toISOString() },
  { id: 'sch-6', school_name: 'SMAN 1 Jakarta', school_type: 'SMA', address: 'Prov. D.K.I. Jakarta, Kota Jakarta Pusat, Kec. Sawah Besar', created_at: new Date().toISOString() },
  { id: 'sch-7', school_name: 'SMKN 2 Bandung', school_type: 'SMK', address: 'Prov. Jawa Barat, Kota Bandung, Kec. Lengkong', created_at: new Date().toISOString() },
  { id: 'sch-8', school_name: 'SMAN 3 Semarang', school_type: 'SMA', address: 'Prov. Jawa Tengah, Kota Semarang, Kec. Semarang Tengah', created_at: new Date().toISOString() },
];

function filterDemoSchools(
  query: string,
  typeFilter?: SchoolType | null,
  provinceFilter?: string | null,
  cityFilter?: string | null,
  limit = 50
): School[] {
  let list = DEMO_FALLBACK_SCHOOLS;
  if (typeFilter) {
    list = list.filter(s => s.school_type === typeFilter);
  }
  if (provinceFilter && provinceFilter.trim()) {
    list = list.filter(s => s.address?.toLowerCase().includes(provinceFilter.trim().toLowerCase()));
  }
  if (cityFilter && cityFilter.trim()) {
    list = list.filter(s => s.address?.toLowerCase().includes(cityFilter.trim().toLowerCase()));
  }
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter(s => s.school_name.toLowerCase().includes(q) || (s.address && s.address.toLowerCase().includes(q)));
  }
  return list.slice(0, limit);
}

/** Search schools by name/address with filtering and sorting */
export async function searchSchools(
  query: string,
  typeFilter?: SchoolType | null,
  limit = 50,
  sortBy: SchoolSortBy = 'name',
  provinceFilter?: string | null,
  cityFilter?: string | null,
  districtFilter?: string | null
): Promise<School[]> {
  try {
    let q = db.from('schools').select('*');

    if (typeFilter) {
      q = q.eq('school_type', typeFilter);
    }

    if (provinceFilter && provinceFilter.trim()) {
      q = q.ilike('address', `%${provinceFilter.trim()}%`);
    }

    if (cityFilter && cityFilter.trim()) {
      q = q.ilike('address', `%${cityFilter.trim()}%`);
    }

    if (districtFilter && districtFilter.trim()) {
      q = q.ilike('address', `%${districtFilter.trim()}%`);
    }

    if (query.trim()) {
      const words = query.trim().split(/\s+/);
      words.forEach(word => {
        q = q.or(`school_name.ilike.%${word}%,address.ilike.%${word}%`);
      });
    }

    if (sortBy === 'name') {
      q = q.order('school_name', { ascending: true });
    } else {
      q = q.order('address', { ascending: true, nullsFirst: false }).order('school_name', { ascending: true });
    }

    const { data, error } = await q.limit(limit);

    if (error || !data || data.length === 0) {
      return filterDemoSchools(query, typeFilter, provinceFilter, cityFilter, limit);
    }
    const result = data as School[];

    if (sortBy !== 'name' && result.length > 0) {
      result.sort((a, b) => {
        const addrA = a.address || '';
        const addrB = b.address || '';
        return addrA.localeCompare(addrB);
      });
    }

    return result;
  } catch (_) {
    return filterDemoSchools(query, typeFilter, provinceFilter, cityFilter, limit);
  }
}

/** Get distinct cities/regencies (Kabupaten/Kota) for a province */
export async function getCitiesByProvince(province?: string | null): Promise<string[]> {
  let q = db.from('schools').select('address');
  if (province && province.trim()) {
    q = q.ilike('address', `%${province.trim()}%`);
  }
  const { data, error } = await q.limit(1000);
  if (error || !data) return [];

  const citiesSet = new Set<string>();
  data.forEach(row => {
    if (!row.address) return;
    const match = row.address.match(/(?:Kab\.|Kota)\s+([^,]+)/i);
    if (match && match[1]) {
      citiesSet.add(match[1].trim());
    }
  });

  return Array.from(citiesSet).sort((a, b) => a.localeCompare(b));
}

/** Get distinct districts (Kecamatan) for a city/province */
export async function getDistrictsByCity(city?: string | null, province?: string | null): Promise<string[]> {
  let q = db.from('schools').select('address');
  if (city && city.trim()) {
    q = q.ilike('address', `%${city.trim()}%`);
  } else if (province && province.trim()) {
    q = q.ilike('address', `%${province.trim()}%`);
  }
  const { data, error } = await q.limit(1000);
  if (error || !data) return [];

  const districtSet = new Set<string>();
  data.forEach(row => {
    if (!row.address) return;
    const match = row.address.match(/Kec\.\s+([^,]+)/i);
    if (match && match[1]) {
      districtSet.add(match[1].trim());
    }
  });

  return Array.from(districtSet).sort((a, b) => a.localeCompare(b));
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
