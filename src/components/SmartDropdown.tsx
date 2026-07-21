// ============================================================================
// LENTERA APPS - Smart Dropdown Component
// Reusable dropdown with search, used by all picker components
// ============================================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  Modal, Animated, Dimensions, Platform, KeyboardAvoidingView, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Search, X, ChevronDown, Check, Plus, ArrowUpDown } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface DropdownItem {
  id: string;
  label: string;
  sublabel?: string;
}

export interface SortOption {
  id: string;
  label: string;
}

interface SmartDropdownProps {
  label: string;
  placeholder?: string;
  items: DropdownItem[];
  selectedId: string | null;
  onSelect: (item: DropdownItem) => void;
  searchable?: boolean;
  disabled?: boolean;
  // Styling
  hc?: boolean; // high contrast
  // Custom input option
  allowCustom?: boolean;
  customPlaceholder?: string;
  onCreateCustom?: (value: string) => void;
  // Multi-select
  multiSelect?: boolean;
  selectedIds?: string[];
  onMultiSelect?: (items: DropdownItem[]) => void;
  // Loading
  loading?: boolean;
  onSearchChange?: (text: string) => void;
  // Sort options inside modal
  sortOptions?: SortOption[];
  activeSortId?: string;
  onSortChange?: (sortId: string) => void;
}

export function SmartDropdown({
  label,
  placeholder = 'Pilih...',
  items,
  selectedId,
  onSelect,
  searchable = true,
  disabled = false,
  hc = false,
  allowCustom = false,
  customPlaceholder = 'Ketik nama baru...',
  onCreateCustom,
  multiSelect = false,
  selectedIds = [],
  onMultiSelect,
  loading = false,
  onSearchChange,
  sortOptions,
  activeSortId,
  onSortChange,
}: SmartDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customValue, setCustomValue] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const textColor = hc ? '#f8fafc' : '#0f172a';
  const mutedColor = hc ? '#94a3b8' : '#64748b';
  const bgColor = hc ? '#1e293b' : '#ffffff';
  const inputBg = hc ? '#334155' : '#f8fafc';
  const borderColor = hc ? '#475569' : '#e2e8f0';
  const accentColor = '#1e3a8a';
  const accentBg = hc ? 'rgba(30,58,138,0.3)' : '#eff6ff';

  useEffect(() => {
    if (open) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [open]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase().trim();
    return items.filter(
      item =>
        item.label.toLowerCase().includes(q) ||
        (item.sublabel && item.sublabel.toLowerCase().includes(q))
    );
  }, [items, search]);

  const selectedItem = items.find(i => i.id === selectedId);
  const selectedLabels = multiSelect
    ? items.filter(i => selectedIds.includes(i.id)).map(i => i.label)
    : [];

  const displayText = multiSelect
    ? selectedLabels.length > 0
      ? selectedLabels.join(', ')
      : placeholder
    : selectedItem?.label || placeholder;

  const handleSelect = (item: DropdownItem) => {
    if (multiSelect) {
      const newIds = selectedIds.includes(item.id)
        ? selectedIds.filter(id => id !== item.id)
        : [...selectedIds, item.id];
      const selected = items.filter(i => newIds.includes(i.id));
      onMultiSelect?.(selected);
    } else {
      onSelect(item);
      closeModal();
    }
  };

  const closeModal = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setOpen(false);
      setSearch('');
      setCustomValue('');
    });
  };

  const handleCreateCustom = () => {
    if (customValue.trim() && onCreateCustom) {
      onCreateCustom(customValue.trim());
      setCustomValue('');
    }
  };

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{label}</Text>

      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled || loading}
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
          backgroundColor: inputBg, borderWidth: 1, borderColor,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
          {loading && <ActivityIndicator size="small" color="#1e3a8a" />}
          <Text
            numberOfLines={1}
            style={{
              flex: 1, fontSize: 14,
              color: (selectedItem || selectedLabels.length > 0) ? textColor : mutedColor,
              fontWeight: (selectedItem || selectedLabels.length > 0) ? '600' : '400',
            }}
          >
            {loading ? 'Memuat data...' : displayText}
          </Text>
        </View>
        <ChevronDown size={18} color={mutedColor} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="none" onRequestClose={closeModal}>
        <Animated.View
          style={{
            flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center', alignItems: 'center',
            paddingHorizontal: 20, paddingVertical: 40,
            opacity: fadeAnim,
          }}
        >
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            activeOpacity={1}
            onPress={closeModal}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%', maxWidth: 440 }}
          >
            <Animated.View
              style={{
                backgroundColor: bgColor,
                borderRadius: 20,
                maxHeight: SCREEN_HEIGHT * 0.7,
                overflow: 'hidden',
                // Shadow
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 24,
                elevation: 16,
                transform: [{
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1],
                  }),
                }],
              }}
            >
              {/* Header */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 20, paddingVertical: 16,
                borderBottomWidth: 1, borderBottomColor: borderColor,
              }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: textColor }}>
                  {label}
                </Text>
                {multiSelect && (
                  <TouchableOpacity
                    onPress={closeModal}
                    style={{
                      backgroundColor: accentColor, paddingHorizontal: 16, paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                      Selesai ({selectedIds.length})
                    </Text>
                  </TouchableOpacity>
                )}
                {!multiSelect && (
                  <TouchableOpacity
                    onPress={closeModal}
                    style={{
                      width: 32, height: 32, borderRadius: 16,
                      backgroundColor: hc ? '#334155' : '#f1f5f9',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <X size={18} color={mutedColor} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Search */}
              {searchable && (
                <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 }}>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: inputBg, borderRadius: 12,
                    paddingHorizontal: 12, borderWidth: 1.5, borderColor,
                  }}>
                    <Search size={16} color={mutedColor} />
                    <TextInput
                      value={search}
                      onChangeText={(t) => {
                        setSearch(t);
                        if (onSearchChange) {
                          if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                          searchTimeoutRef.current = setTimeout(() => {
                            onSearchChange(t);
                          }, 600);
                        }
                      }}
                      placeholder="Cari..."
                      placeholderTextColor={mutedColor}
                      style={{
                        flex: 1, paddingVertical: 11, paddingHorizontal: 8,
                        fontSize: 14, color: textColor,
                      }}
                      autoFocus
                    />
                    {loading ? (
                      <ActivityIndicator size="small" color="#1e3a8a" style={{ marginLeft: 6 }} />
                    ) : search.length > 0 ? (
                      <TouchableOpacity onPress={() => {
                        setSearch('');
                        if (onSearchChange) onSearchChange('');
                      }}>
                        <X size={16} color={mutedColor} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              )}

              {/* Sort By Options */}
              {sortOptions && sortOptions.length > 0 && (
                <View style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ArrowUpDown size={13} color={mutedColor} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: mutedColor, marginRight: 2 }}>
                      Urutkan:
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {sortOptions.map(opt => {
                        const isActive = activeSortId === opt.id;
                        return (
                          <TouchableOpacity
                            key={opt.id}
                            onPress={() => onSortChange?.(opt.id)}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                              borderRadius: 8,
                              backgroundColor: isActive ? accentColor : (hc ? '#334155' : '#f1f5f9'),
                              borderWidth: 1,
                              borderColor: isActive ? accentColor : (hc ? '#475569' : '#e2e8f0'),
                            }}
                          >
                            <Text style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: isActive ? '#ffffff' : textColor,
                            }}>
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              )}

              {/* Custom Input */}
              {allowCustom && (
                <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                  }}>
                    <TextInput
                      value={customValue}
                      onChangeText={setCustomValue}
                      placeholder={customPlaceholder}
                      placeholderTextColor={mutedColor}
                      style={{
                        flex: 1, paddingVertical: 10, paddingHorizontal: 12,
                        fontSize: 14, color: textColor,
                        backgroundColor: inputBg, borderRadius: 10,
                        borderWidth: 1, borderColor,
                      }}
                    />
                    <TouchableOpacity
                      onPress={handleCreateCustom}
                      disabled={!customValue.trim()}
                      style={{
                        width: 40, height: 40, borderRadius: 10,
                        backgroundColor: customValue.trim() ? accentColor : borderColor,
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Plus size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Loading indicator */}
              {loading && (
                <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
                  <View style={{
                    height: 3, borderRadius: 2, backgroundColor: hc ? '#334155' : '#e2e8f0',
                    overflow: 'hidden',
                  }}>
                    <Animated.View style={{
                      width: '40%', height: '100%', borderRadius: 2,
                      backgroundColor: accentColor,
                    }} />
                  </View>
                </View>
              )}

              {/* Items List */}
              <FlatList
                data={filteredItems}
                keyExtractor={item => item.id}
                style={{ paddingHorizontal: 16, marginTop: 8 }}
                contentContainerStyle={{ paddingBottom: 16 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={{ padding: 32, alignItems: 'center', gap: 10 }}>
                    {loading ? (
                      <>
                        <ActivityIndicator size="small" color="#1e3a8a" />
                        <Text style={{ color: mutedColor, fontSize: 13, fontWeight: '500' }}>
                          Memuat data sekolah...
                        </Text>
                      </>
                    ) : (
                      <Text style={{ color: mutedColor, fontSize: 14 }}>
                        {search ? 'Tidak ditemukan' : 'Belum ada data'}
                      </Text>
                    )}
                  </View>
                }
                renderItem={({ item }) => {
                  const isSelected = multiSelect
                    ? selectedIds.includes(item.id)
                    : selectedId === item.id;

                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSelect(item)}
                      style={{
                        flexDirection: 'row', alignItems: 'center',
                        paddingVertical: 12, paddingHorizontal: 12,
                        borderRadius: 12, marginBottom: 4,
                        backgroundColor: isSelected ? accentBg : 'transparent',
                      }}
                    >
                      {multiSelect && (
                        <View style={{
                          width: 22, height: 22, borderRadius: 6, marginRight: 12,
                          borderWidth: 2,
                          borderColor: isSelected ? accentColor : borderColor,
                          backgroundColor: isSelected ? accentColor : 'transparent',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isSelected && <Check size={14} color="#fff" />}
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 14, color: textColor,
                          fontWeight: isSelected ? '700' : '500',
                        }}>
                          {item.label}
                        </Text>
                        {item.sublabel && (
                          <Text numberOfLines={2} style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>
                            {item.sublabel}
                          </Text>
                        )}
                      </View>
                      {!multiSelect && isSelected && (
                        <Check size={18} color={accentColor} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>
    </View>
  );
}
