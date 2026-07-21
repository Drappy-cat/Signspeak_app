// ============================================================================
// LENTERA APPS - Picker Components
// Domain-specific wrappers around SmartDropdown
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { SmartDropdown, DropdownItem } from './SmartDropdown';
import { Plus } from 'lucide-react-native';
import { searchSchools, createSchool, getGradesBySchoolType, getClassesBySchoolAndGrade, createClass } from '../services/schoolService';
import { getAllSubjects, createCustomSubject } from '../services/teacherService';
import type { School, Grade, Class, Subject, SchoolType } from '../types/database';

// ── SchoolPicker ─────────────────────────────────────────────────────────────

interface SchoolPickerProps {
  selectedSchool: School | null;
  onSelectSchool: (school: School) => void;
  hc?: boolean;
  appLang?: string;
}

export function SchoolPicker({ selectedSchool, onSelectSchool, hc = false, appLang = 'id' }: SchoolPickerProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<SchoolType | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [creating, setCreating] = useState(false);

  const textColor = hc ? '#f8fafc' : '#0f172a';
  const mutedColor = hc ? '#94a3b8' : '#64748b';
  const inputBg = hc ? '#334155' : '#f8fafc';
  const borderColor = hc ? '#475569' : '#e2e8f0';

  const [filterType, setFilterType] = useState<SchoolType | null>(null);
  const [lastQuery, setLastQuery] = useState('');

  const loadSchools = useCallback(async (query?: string) => {
    const activeQuery = query !== undefined ? query : lastQuery;
    if (query !== undefined) setLastQuery(query);

    setLoading(true);
    try {
      const result = await searchSchools(activeQuery, filterType, 50);
      setSchools(result);
    } catch (e) {
      console.error('Failed to load schools:', e);
    } finally {
      setLoading(false);
    }
  }, [filterType, lastQuery]);

  useEffect(() => { loadSchools(); }, [loadSchools]);

  const items: DropdownItem[] = schools.map(s => ({
    id: s.id,
    label: s.school_name,
    sublabel: `${s.school_type}${s.address ? ` · ${s.address}` : ''}`,
  }));

  const schoolTypes: SchoolType[] = ['SD', 'SMP', 'SMA', 'SMK', 'SLB'];

  const handleCreate = async () => {
    if (!newName.trim() || !newType) return;
    setCreating(true);
    try {
      const school = await createSchool({
        school_name: newName.trim(),
        school_type: newType,
        address: newAddress.trim() || null,
      });
      onSelectSchool(school);
      setShowCreate(false);
      setNewName('');
      setNewType(null);
      setNewAddress('');
      loadSchools();
    } catch (e: any) {
      console.error('Failed to create school:', e);
    } finally {
      setCreating(false);
    }
  };


  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
        <TouchableOpacity
          onPress={() => setFilterType(null)}
          style={{
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
            backgroundColor: filterType === null ? '#1e3a8a' : inputBg,
            borderWidth: 1, borderColor: filterType === null ? '#1e3a8a' : borderColor,
          }}
        >
          <Text style={{ fontSize: 12, color: filterType === null ? '#fff' : mutedColor, fontWeight: '600' }}>
            Semua
          </Text>
        </TouchableOpacity>
        {schoolTypes.map(type => (
          <TouchableOpacity
            key={type}
            onPress={() => setFilterType(type)}
            style={{
              paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
              backgroundColor: filterType === type ? '#1e3a8a' : inputBg,
              borderWidth: 1, borderColor: filterType === type ? '#1e3a8a' : borderColor,
            }}
          >
            <Text style={{ fontSize: 12, color: filterType === type ? '#fff' : mutedColor, fontWeight: '600' }}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SmartDropdown
        label={appLang === 'en' ? 'School' : 'Sekolah'}
        placeholder={appLang === 'en' ? 'Search or select school...' : 'Cari atau pilih sekolah...'}
        items={items}
        selectedId={selectedSchool?.id || null}
        onSelect={(item) => {
          const school = schools.find(s => s.id === item.id);
          if (school) onSelectSchool(school);
        }}
        hc={hc}
        loading={loading}
        onSearchChange={loadSchools}
      />

      {!showCreate ? (
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}
        >
          <Plus size={14} color="#1e3a8a" />
          <Text style={{ fontSize: 13, color: '#1e3a8a', fontWeight: '600' }}>
            {appLang === 'en' ? 'Register new school' : 'Daftarkan sekolah baru'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={{
          gap: 10, padding: 14, borderRadius: 12,
          backgroundColor: hc ? '#1e293b' : '#f0f7ff',
          borderWidth: 1, borderColor: hc ? '#334155' : '#bfdbfe',
        }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>
            {appLang === 'en' ? 'Register New School' : 'Daftarkan Sekolah Baru'}
          </Text>

          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder={appLang === 'en' ? 'School name' : 'Nama sekolah'}
            placeholderTextColor={mutedColor}
            style={{
              borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
              fontSize: 14, color: textColor, backgroundColor: inputBg,
              borderWidth: 1, borderColor,
            }}
          />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {schoolTypes.map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => setNewType(type)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
                  backgroundColor: newType === type ? '#1e3a8a' : inputBg,
                  borderWidth: 1, borderColor: newType === type ? '#1e3a8a' : borderColor,
                }}
              >
                <Text style={{
                  fontSize: 13, fontWeight: '700',
                  color: newType === type ? '#fff' : textColor,
                }}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            value={newAddress}
            onChangeText={setNewAddress}
            placeholder={appLang === 'en' ? 'Address (optional)' : 'Alamat (opsional)'}
            placeholderTextColor={mutedColor}
            style={{
              borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
              fontSize: 14, color: textColor, backgroundColor: inputBg,
              borderWidth: 1, borderColor,
            }}
          />

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => { setShowCreate(false); setNewName(''); setNewType(null); setNewAddress(''); }}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 8,
                alignItems: 'center', borderWidth: 1, borderColor,
              }}
            >
              <Text style={{ color: mutedColor, fontWeight: '600', fontSize: 13 }}>
                {appLang === 'en' ? 'Cancel' : 'Batal'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={!newName.trim() || !newType || creating}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 8,
                alignItems: 'center',
                backgroundColor: (!newName.trim() || !newType) ? '#94a3b8' : '#1e3a8a',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                {creating ? '...' : (appLang === 'en' ? 'Create' : 'Buat')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ── GradePicker ──────────────────────────────────────────────────────────────

interface GradePickerProps {
  schoolType: SchoolType | null;
  selectedGrade: Grade | null;
  onSelectGrade: (grade: Grade) => void;
  hc?: boolean;
  appLang?: string;
}

export function GradePicker({ schoolType, selectedGrade, onSelectGrade, hc = false, appLang = 'id' }: GradePickerProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!schoolType) {
      setGrades([]);
      return;
    }
    setLoading(true);
    getGradesBySchoolType(schoolType)
      .then(setGrades)
      .catch(e => console.error('Failed to load grades:', e))
      .finally(() => setLoading(false));
  }, [schoolType]);

  const items: DropdownItem[] = grades.map(g => ({
    id: g.id,
    label: `Kelas ${g.grade_name}`,
    sublabel: g.school_type,
  }));

  return (
    <SmartDropdown
      label={appLang === 'en' ? 'Grade Level' : 'Tingkat / Kelas'}
      placeholder={!schoolType
        ? (appLang === 'en' ? 'Select school first' : 'Pilih sekolah terlebih dahulu')
        : (appLang === 'en' ? 'Select grade...' : 'Pilih tingkat...')
      }
      items={items}
      selectedId={selectedGrade?.id || null}
      onSelect={(item) => {
        const grade = grades.find(g => g.id === item.id);
        if (grade) onSelectGrade(grade);
      }}
      disabled={!schoolType}
      searchable={false}
      hc={hc}
      loading={loading}
    />
  );
}

// ── ClassPicker ──────────────────────────────────────────────────────────────

interface ClassPickerProps {
  schoolId: string | null;
  gradeId: string | null;
  selectedClassIds: string[];
  onSelectClasses: (classes: Class[]) => void;
  hc?: boolean;
  appLang?: string;
  authUserId?: string;
}

export function ClassPicker({
  schoolId, gradeId, selectedClassIds, onSelectClasses,
  hc = false, appLang = 'id', authUserId,
}: ClassPickerProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!schoolId || !gradeId) {
      setClasses([]);
      return;
    }
    setLoading(true);
    getClassesBySchoolAndGrade(schoolId, gradeId)
      .then(result => setClasses(result as Class[]))
      .catch(e => console.error('Failed to load classes:', e))
      .finally(() => setLoading(false));
  }, [schoolId, gradeId]);

  const items: DropdownItem[] = classes.map(c => ({
    id: c.id,
    label: c.class_name,
    sublabel: c.room_code ? `Kode: ${c.room_code}` : undefined,
  }));

  const handleCreateClass = async (className: string) => {
    if (!schoolId || !gradeId) return;
    try {
      const newClass = await createClass({
        school_id: schoolId,
        grade_id: gradeId,
        class_name: className,
        created_by: authUserId || null,
      });
      setClasses(prev => [...prev, newClass]);
      const allSelected = [...classes.filter(c => selectedClassIds.includes(c.id)), newClass];
      onSelectClasses(allSelected);
    } catch (e: any) {
      console.error('Failed to create class:', e);
    }
  };

  return (
    <SmartDropdown
      label={appLang === 'en' ? 'Class' : 'Kelas yang Diajar'}
      placeholder={!schoolId || !gradeId
        ? (appLang === 'en' ? 'Select grade first' : 'Pilih tingkat terlebih dahulu')
        : (appLang === 'en' ? 'Select classes...' : 'Pilih kelas...')
      }
      items={items}
      selectedId={null}
      onSelect={() => {}}
      multiSelect
      selectedIds={selectedClassIds}
      onMultiSelect={(selected) => {
        const selectedClasses = classes.filter(c => selected.some(s => s.id === c.id));
        onSelectClasses(selectedClasses);
      }}
      disabled={!schoolId || !gradeId}
      hc={hc}
      loading={loading}
      allowCustom
      customPlaceholder={appLang === 'en' ? 'Create new class (e.g. A, IPA 1)' : 'Buat kelas baru (misal: A, IPA 1)'}
      onCreateCustom={handleCreateClass}
    />
  );
}

// ── SubjectPicker ────────────────────────────────────────────────────────────

interface SubjectPickerProps {
  selectedSubjectIds: string[];
  onSelectSubjects: (subjects: Subject[]) => void;
  hc?: boolean;
  appLang?: string;
  authUserId?: string;
}

export function SubjectPicker({
  selectedSubjectIds, onSelectSubjects,
  hc = false, appLang = 'id', authUserId,
}: SubjectPickerProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAllSubjects()
      .then(setSubjects)
      .catch(e => console.error('Failed to load subjects:', e))
      .finally(() => setLoading(false));
  }, []);

  const items: DropdownItem[] = subjects.map(s => ({
    id: s.id,
    label: s.subject_name,
    sublabel: s.is_custom ? 'Custom' : undefined,
  }));

  const handleCreateCustomSubject = async (name: string) => {
    if (!authUserId) return;
    try {
      const newSubject = await createCustomSubject(name, authUserId);
      setSubjects(prev => {
        if (prev.find(s => s.id === newSubject.id)) return prev;
        return [...prev, newSubject];
      });
      const allSelected = [...subjects.filter(s => selectedSubjectIds.includes(s.id)), newSubject];
      onSelectSubjects(allSelected);
    } catch (e: any) {
      console.error('Failed to create subject:', e);
    }
  };

  return (
    <SmartDropdown
      label={appLang === 'en' ? 'Subjects' : 'Mata Pelajaran yang Diajar'}
      placeholder={appLang === 'en' ? 'Select subjects...' : 'Pilih mata pelajaran...'}
      items={items}
      selectedId={null}
      onSelect={() => {}}
      multiSelect
      selectedIds={selectedSubjectIds}
      onMultiSelect={(selected) => {
        const selectedSubjects = subjects.filter(s => selected.some(sel => sel.id === s.id));
        onSelectSubjects(selectedSubjects);
      }}
      hc={hc}
      loading={loading}
      allowCustom
      customPlaceholder={appLang === 'en' ? 'Add custom subject...' : 'Tambah mapel lainnya...'}
      onCreateCustom={handleCreateCustomSubject}
    />
  );
}
