import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StudentCacheData {
  name: string;
  absen: string;
  className?: string; // Optional if we want to expand later
  timestamp: number;
}

const CACHE_KEY = '@lentera/student_profile_cache';
const EXPIRY_MS = 60 * 60 * 1000; // 60 minutes in milliseconds

/**
 * Save student data to local cache with a timestamp
 */
export const saveStudentCache = async (name: string, absen: string, className?: string): Promise<void> => {
  try {
    const data: StudentCacheData = {
      name,
      absen,
      className,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save student cache:', error);
  }
};

/**
 * Load student data from cache. 
 * Returns null if cache is expired or doesn't exist.
 */
export const loadStudentCache = async (): Promise<StudentCacheData | null> => {
  try {
    const jsonStr = await AsyncStorage.getItem(CACHE_KEY);
    if (!jsonStr) return null;

    const data: StudentCacheData = JSON.parse(jsonStr);
    const now = Date.now();
    
    // Check if cache has expired
    if (now - data.timestamp > EXPIRY_MS) {
      // Clear expired cache silently
      await AsyncStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Failed to load student cache:', error);
    return null;
  }
};

/**
 * Clear the student cache manually
 */
export const clearStudentCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear student cache:', error);
  }
};
