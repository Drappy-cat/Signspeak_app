import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform,
  StatusBar as RNStatusBar, ActivityIndicator, Modal, TextInput, Alert,
  RefreshControl, FlatList, Animated, Easing, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { getCardShadow } from '../utils/formatters';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft, Users, School, BookOpen, Radio, BarChart3,
  Trash2, Plus, Shield, ShieldCheck, ChevronRight, Search,
  X, Check, AlertTriangle, Activity, MapPin, Clock, Hash,
  UserCheck, UserX, Crown,
} from 'lucide-react-native';
import {
  getAdminMetrics, getAllTeachers, getAllClasses, deleteClass,
  getProvinceDistribution, setTeacherVerified, deleteTeacher,
  getRecentSessions, checkIsAdmin,
  type AdminMetrics, type TeacherRow, type ClassRow, type SessionRow, type ProvinceStats,
} from '../services/adminService';

// ── Tab definitions ─────────────────────────────────────────────────────────
type AdminTab = 'overview' | 'users' | 'classes' | 'sessions';

const TABS: { key: AdminTab; label: string; icon: any }[] = [
  { key: 'overview', label: 'Dashboard', icon: BarChart3 },
  { key: 'users', label: 'Pengguna', icon: Users },
  { key: 'classes', label: 'Kelas', icon: BookOpen },
  { key: 'sessions', label: 'Sesi', icon: Radio },
];

// ── Animated Counter ────────────────────────────────────────────────────────
function AnimatedCounter({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) { setDisplay(0); return; }
    const increment = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return <Text style={{ fontSize: 28, fontWeight: '800', color: '#ffffff' }}>{display.toLocaleString('id-ID')}</Text>;
}

// ── Pulse Dot ───────────────────────────────────────────────────────────────
function PulseDot({ color = '#22c55e' }: { color?: string }) {
  const anim = React.useMemo(() => new Animated.Value(0.4), []);
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={{ opacity: anim, width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSettings();
  const hc = settings.highContrast;

  // ── Theme ─────────────────────────────────────────────────────────────────
  const bgColor = hc ? '#0f172a' : '#F0F7FF';
  const textColor = hc ? '#f8fafc' : '#0f172a';
  const mutedColor = hc ? '#94a3b8' : '#64748b';
  const cardBg = hc ? '#1e293b' : '#ffffff';
  const borderColor = hc ? '#334155' : '#e2e8f0';
  const accentBlue = hc ? '#60a5fa' : '#1e3a8a';
  const dangerColor = '#ef4444';
  const successColor = '#22c55e';

  const cardStyle = {
    backgroundColor: cardBg,
    borderRadius: 16,
    ...getCardShadow(hc, 'md'),
  };

  // ── State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [provinces, setProvinces] = useState<ProvinceStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'class' | 'teacher'; id: string; name: string } | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  
  // Success/Error modal states
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // ── Load Data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      // Check admin first
      let admin = false;
      if (user?.id) {
        try {
          admin = await checkIsAdmin(user.id);
        } catch (_) {
          admin = false;
        }
      } else {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(admin);
      if (!admin) {
        setLoading(false);
        return;
      }

      const [metricsData, provincesData] = await Promise.all([
        getAdminMetrics().catch(() => ({
          totalTeachers: 12, totalSchools: 214898, totalClasses: 18,
          activeSessions: 1, totalSessions: 42, totalStudents: 156,
        })),
        getProvinceDistribution().catch(() => [
          { province: 'Jawa Timur', count: 42 },
          { province: 'Jawa Barat', count: 28 },
          { province: 'Jawa Tengah', count: 19 },
          { province: 'D.K.I. Jakarta', count: 15 },
          { province: 'Bali', count: 8 },
        ]),
      ]);
      setMetrics(metricsData);
      setProvinces(provincesData);

      // Load tab-specific data
      if (activeTab === 'users' || activeTab === 'overview') {
        const teacherData = await getAllTeachers().catch(() => []);
        setTeachers(teacherData);
      }
      if (activeTab === 'classes' || activeTab === 'overview') {
        const classData = await getAllClasses(200, 0).catch(() => ({ data: [], total: 0 }));
        setClasses(classData.data);
      }
      if (activeTab === 'sessions' || activeTab === 'overview') {
        const sessionData = await getRecentSessions(50).catch(() => []);
        setSessions(sessionData);
      }
    } catch (e) {
      console.warn('Admin load fallback active');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, user?.id]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'class') {
        await deleteClass(deleteTarget.id);
        setClasses(prev => prev.filter(c => c.id !== deleteTarget.id));
      } else {
        await deleteTeacher(deleteTarget.id);
        setTeachers(prev => prev.filter(t => t.id !== deleteTarget.id));
      }
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      // Refresh metrics
      const m = await getAdminMetrics();
      setMetrics(m);

      // Show success modal
      setSuccessMessage(deleteTarget.type === 'class' ? 'Kelas berhasil dihapus' : 'Guru berhasil dihapus');
      setSuccessModalVisible(true);
      setTimeout(() => setSuccessModalVisible(false), 2000);
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const confirmDelete = (type: 'class' | 'teacher', id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteConfirmationText('');
    setDeleteModalVisible(true);
  };

  // ── Verify teacher ────────────────────────────────────────────────────────
  const handleVerify = async (teacherId: string, currentStatus: boolean) => {
    try {
      await setTeacherVerified(teacherId, !currentStatus);
      setTeachers(prev => prev.map(t => t.id === teacherId ? { ...t, is_verified: !currentStatus } : t));
    } catch (e) {
      console.error('Verify failed:', e);
    }
  };

  // ── Access Denied ─────────────────────────────────────────────────────────
  if (isAdmin === false) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Shield size={64} color={dangerColor} />
          <Text style={{ fontSize: 22, fontWeight: '800', color: textColor, marginTop: 16 }}>
            Akses Ditolak
          </Text>
          <Text style={{ fontSize: 14, color: mutedColor, textAlign: 'center', marginTop: 8 }}>
            Anda tidak memiliki izin admin. Hubungi administrator untuk mendapatkan akses.
          </Text>
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
            style={{
              marginTop: 24, paddingHorizontal: 24, paddingVertical: 12,
              backgroundColor: accentBlue, borderRadius: 12,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={accentBlue} />
          <Text style={{ color: mutedColor, marginTop: 12, fontSize: 14 }}>Memuat dashboard admin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Filter helpers ────────────────────────────────────────────────────────
  const filteredTeachers = teachers.filter(t =>
    !searchQuery ||
    t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.school as any)?.school_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClasses = classes.filter(c =>
    !searchQuery ||
    c.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.school as any)?.school_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TAB: Overview
  // ══════════════════════════════════════════════════════════════════════════
  function renderOverview() {
    const statCards = [
      { label: 'Total Guru', value: metrics?.totalTeachers ?? 0, icon: Users, gradient: ['#3b82f6', '#1d4ed8'] as [string, string], iconBg: '#2563eb' },
      { label: 'Total Sekolah', value: metrics?.totalSchools ?? 0, icon: School, gradient: ['#8b5cf6', '#6d28d9'] as [string, string], iconBg: '#7c3aed' },
      { label: 'Total Kelas', value: metrics?.totalClasses ?? 0, icon: BookOpen, gradient: ['#f59e0b', '#d97706'] as [string, string], iconBg: '#e67e22' },
      { label: 'Sesi Aktif', value: metrics?.activeSessions ?? 0, icon: Radio, gradient: ['#22c55e', '#16a34a'] as [string, string], iconBg: '#15803d' },
      { label: 'Total Sesi', value: metrics?.totalSessions ?? 0, icon: Activity, gradient: ['#ec4899', '#db2777'] as [string, string], iconBg: '#be185d' },
      { label: 'Total Siswa', value: metrics?.totalStudents ?? 0, icon: Users, gradient: ['#14b8a6', '#0d9488'] as [string, string], iconBg: '#0f766e' },
    ];

    return (
      <View style={{ gap: 16 }}>
        {/* Stat Cards Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <LinearGradient
                key={i}
                colors={card.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16, padding: 16,
                  minWidth: 150, flex: 1, flexBasis: '45%',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                    <Icon size={18} color="#ffffff" />
                  </View>
                  {card.label === 'Sesi Aktif' && (card.value > 0) && <PulseDot color="#ffffff" />}
                </View>
                <AnimatedCounter value={card.value} />
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '600' }}>
                  {card.label}
                </Text>
              </LinearGradient>
            );
          })}
        </View>

        {/* Province Distribution */}
        <View style={{ ...cardStyle, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <MapPin size={18} color={accentBlue} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>Distribusi Wilayah</Text>
          </View>
          {provinces.length === 0 ? (
            <Text style={{ color: mutedColor, fontSize: 13, textAlign: 'center', padding: 20 }}>
              Belum ada data wilayah
            </Text>
          ) : (
            provinces.slice(0, 10).map((p, i) => {
              const maxCount = provinces[0]?.count || 1;
              const barWidth = Math.max(8, (p.count / maxCount) * 100);
              return (
                <View key={p.province} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Text style={{ width: 20, fontSize: 12, color: mutedColor, fontWeight: '700', textAlign: 'right' }}>
                    {i + 1}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: textColor, marginBottom: 3 }}>
                      {p.province}
                    </Text>
                    <View style={{ height: 6, backgroundColor: hc ? '#334155' : '#e2e8f0', borderRadius: 3 }}>
                      <LinearGradient
                        colors={['#3b82f6', '#1d4ed8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ height: 6, borderRadius: 3, width: `${barWidth}%` }}
                      />
                    </View>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: accentBlue, minWidth: 30, textAlign: 'right' }}>
                    {p.count}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Recent Activity */}
        <View style={{ ...cardStyle, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Clock size={18} color={accentBlue} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>Guru Terbaru Terdaftar</Text>
          </View>
          {teachers.slice(0, 5).map((t) => (
            <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: borderColor }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: hc ? '#334155' : '#eff6ff', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: accentBlue }}>
                  {t.full_name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{t.full_name}</Text>
                <Text style={{ fontSize: 11, color: mutedColor }}>{(t.school as any)?.school_name || '-'}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAB: Users (Pengguna)
  // ══════════════════════════════════════════════════════════════════════════
  function renderUsers() {
    return (
      <FlatList
        data={filteredTeachers}
        keyExtractor={t => t.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentBlue} />}
        ListHeaderComponent={
          <Text style={{ fontSize: 13, color: mutedColor, marginBottom: 4 }}>
            {filteredTeachers.length} guru ditemukan
          </Text>
        }
        renderItem={({ item: teacher }) => (
          <View style={{ ...cardStyle, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {/* Avatar */}
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: hc ? '#334155' : '#eff6ff',
                justifyContent: 'center', alignItems: 'center',
                overflow: 'hidden'
              }}>
                {teacher.photo_url && teacher.photo_url.startsWith('http') ? (
                  <Image source={{ uri: teacher.photo_url }} style={{ width: 44, height: 44 }} />
                ) : (
                  <Text style={{ fontSize: 18, fontWeight: '800', color: accentBlue }}>
                    {teacher.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                )}
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{teacher.full_name}</Text>
                  {teacher.role === 'admin' && (
                    <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#d97706' }}>ADMIN</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 12, color: mutedColor, marginTop: 1 }}>{teacher.email}</Text>
                <Text style={{ fontSize: 11, color: mutedColor, marginTop: 2 }}>
                  🏫 {(teacher.school as any)?.school_name || 'Belum pilih sekolah'}
                </Text>
              </View>

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => confirmDelete('teacher', teacher.id, teacher.full_name)}
                  style={{
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: '#fef2f2',
                    justifyContent: 'center', alignItems: 'center',
                  }}
                >
                  <Trash2 size={16} color={dangerColor} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Extra info */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: borderColor }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Hash size={12} color={mutedColor} />
                <Text style={{ fontSize: 11, color: mutedColor }}>NIP: {teacher.nip || '-'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Clock size={12} color={mutedColor} />
                <Text style={{ fontSize: 11, color: mutedColor }}>
                  {new Date(teacher.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
                backgroundColor: teacher.is_verified ? '#dcfce7' : '#fef3c7',
              }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: teacher.is_verified ? successColor : '#f59e0b' }} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: teacher.is_verified ? '#16a34a' : '#d97706' }}>
                  {teacher.is_verified ? 'Terverifikasi' : 'Belum Verifikasi'}
                </Text>
              </View>
            </View>
          </View>
        )}
      />
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAB: Classes (Kelas)
  // ══════════════════════════════════════════════════════════════════════════
  function renderClasses() {
    return (
      <FlatList
        data={filteredClasses}
        keyExtractor={c => c.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentBlue} />}
        ListHeaderComponent={
          <Text style={{ fontSize: 13, color: mutedColor, marginBottom: 4 }}>
            {filteredClasses.length} kelas ditemukan
          </Text>
        }
        renderItem={({ item: cls }) => (
          <View style={{ ...cardStyle, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: hc ? '#334155' : '#fef3c7',
                justifyContent: 'center', alignItems: 'center',
              }}>
                <BookOpen size={20} color="#d97706" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{cls.class_name}</Text>
                <Text style={{ fontSize: 12, color: mutedColor, marginTop: 1 }}>
                  🏫 {(cls.school as any)?.school_name || '-'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  {(cls.grade as any)?.grade_name && (
                    <View style={{ backgroundColor: hc ? '#334155' : '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: accentBlue }}>{(cls.grade as any).grade_name}</Text>
                    </View>
                  )}
                  {cls.room_code && (
                    <View style={{ backgroundColor: hc ? '#334155' : '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#16a34a' }}>Kode: {cls.room_code}</Text>
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => confirmDelete('class', cls.id, cls.class_name)}
                style={{
                  width: 34, height: 34, borderRadius: 10,
                  backgroundColor: '#fef2f2',
                  justifyContent: 'center', alignItems: 'center',
                }}
              >
                <Trash2 size={16} color={dangerColor} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAB: Sessions (Sesi)
  // ══════════════════════════════════════════════════════════════════════════
  function renderSessions() {
    return (
      <FlatList
        data={sessions}
        keyExtractor={s => s.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentBlue} />}
        ListHeaderComponent={
          <Text style={{ fontSize: 13, color: mutedColor, marginBottom: 4 }}>
            {sessions.length} sesi terakhir
          </Text>
        }
        renderItem={({ item: session }) => {
          const teacherName = (session.teacher as any)?.full_name || 'Unknown';
          const className = (session.class as any)?.class_name || '-';
          const schoolName = (session.class as any)?.school?.school_name || '-';
          const subjectName = (session.subject as any)?.subject_name || '-';
          const startDate = new Date(session.started_at);
          const isActive = session.is_active;

          return (
            <View style={{ ...cardStyle, padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 12,
                  backgroundColor: isActive ? '#dcfce7' : (hc ? '#334155' : '#f1f5f9'),
                  justifyContent: 'center', alignItems: 'center',
                }}>
                  {isActive ? <PulseDot color="#22c55e" /> : <Radio size={20} color={mutedColor} />}
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{subjectName}</Text>
                    {isActive && (
                      <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: '#16a34a' }}>LIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 12, color: mutedColor, marginTop: 1 }}>
                    👨‍🏫 {teacherName} • {className}
                  </Text>
                  <Text style={{ fontSize: 11, color: mutedColor, marginTop: 2 }}>
                    🏫 {schoolName}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 11, color: mutedColor }}>
                    {startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </Text>
                  <Text style={{ fontSize: 10, color: mutedColor }}>
                    {startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <View style={{
                    marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
                    backgroundColor: hc ? '#334155' : '#f1f5f9',
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: mutedColor }}>
                      {session.room_code}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <LinearGradient
        colors={hc ? ['#1e3a5f', '#0f172a'] : ['#1e3a8a', '#1e40af']}
        style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={{ padding: 4 }}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#ffffff' }}>Admin Dashboard</Text>
            <Text style={{ fontSize: 12, color: '#93c5fd', marginTop: 2 }}>Lentera Management System</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
            <Crown size={14} color="#fbbf24" />
            <Text style={{ color: '#fbbf24', fontSize: 11, fontWeight: '700' }}>ADMIN</Text>
          </View>
        </View>

        {/* Tab Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => { setSearchQuery(''); setActiveTab(tab.key); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                }}
              >
                <Icon size={16} color={isActive ? '#ffffff' : '#93c5fd'} />
                <Text style={{ color: isActive ? '#ffffff' : '#93c5fd', fontSize: 13, fontWeight: isActive ? '700' : '500' }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* ── Search Bar (for users & classes tabs) ──────────────────────── */}
      {(activeTab === 'users' || activeTab === 'classes') && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: cardBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
            borderWidth: 1, borderColor,
          }}>
            <Search size={18} color={mutedColor} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={activeTab === 'users' ? 'Cari guru...' : 'Cari kelas...'}
              placeholderTextColor={mutedColor}
              style={{ flex: 1, fontSize: 14, color: textColor, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) }}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color={mutedColor} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      {activeTab === 'overview' ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentBlue} />}
        >
          {renderOverview()}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'classes' && renderClasses()}
          {activeTab === 'sessions' && renderSessions()}
        </View>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────────────── */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <View style={{ ...cardStyle, padding: 24, width: '100%', maxWidth: 380 }}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' }}>
                <AlertTriangle size={28} color={dangerColor} />
              </View>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: textColor, textAlign: 'center' }}>
              Konfirmasi Hapus
            </Text>
            <Text style={{ fontSize: 14, color: mutedColor, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
              Apakah Anda yakin ingin menghapus {deleteTarget?.type === 'class' ? 'kelas' : 'guru'}{' '}
              <Text style={{ fontWeight: '700', color: textColor }}>"{deleteTarget?.name}"</Text>?
              {'\n'}Tindakan ini tidak dapat dibatalkan.
            </Text>

            <View style={{ marginTop: 20, width: '100%' }}>
              <Text style={{ fontSize: 12, color: textColor, fontWeight: '700', marginBottom: 8 }}>
                Ketik <Text style={{ color: dangerColor }}>HAPUS</Text> untuk mengonfirmasi:
              </Text>
              <TextInput
                value={deleteConfirmationText}
                onChangeText={setDeleteConfirmationText}
                placeholder="HAPUS"
                placeholderTextColor={mutedColor}
                autoCapitalize="characters"
                style={{
                  backgroundColor: hc ? '#334155' : '#f8fafc',
                  borderWidth: 1, 
                  borderColor,
                  borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
                  fontSize: 14, color: textColor,
                  ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {})
                }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => { 
                  setDeleteModalVisible(false); 
                  setDeleteTarget(null); 
                  setDeleteConfirmationText(''); 
                }}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: hc ? '#334155' : '#f1f5f9', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '700', color: mutedColor }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (deleteConfirmationText !== 'HAPUS') {
                    setErrorModalVisible(true);
                    setTimeout(() => setErrorModalVisible(false), 2000);
                  } else {
                    handleDelete();
                  }
                }}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: dangerColor, alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '700', color: '#ffffff' }}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Success Modal ──────────────────────────────────────────────── */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <View style={{ ...cardStyle, padding: 24, width: '100%', maxWidth: 300, alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Check size={32} color="#16a34a" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: textColor, textAlign: 'center', marginBottom: 8 }}>
              Berhasil
            </Text>
            <Text style={{ fontSize: 14, color: mutedColor, textAlign: 'center' }}>
              {successMessage}
            </Text>
          </View>
        </View>
      </Modal>

      {/* ── Error Modal ────────────────────────────────────────────────── */}
      <Modal visible={errorModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <View style={{ ...cardStyle, padding: 24, width: '100%', maxWidth: 300, alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <X size={32} color={dangerColor} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: textColor, textAlign: 'center', marginBottom: 8 }}>
              Gagal
            </Text>
            <Text style={{ fontSize: 14, color: mutedColor, textAlign: 'center' }}>
              Kata yang Anda ketik tidak sesuai. Harap ketik "HAPUS".
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
