import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

// ── Constants ─────────────────────────────────────────────────────────────────

const PROFILE_PHOTOS_DIR = Platform.OS !== 'web' ? `${FileSystem.documentDirectory}profile-photos/` : '';

// ── Local Storage Functions ───────────────────────────────────────────────────

/** Ensure the profile photos directory exists */
async function ensureDirectoryExists() {
  if (Platform.OS === 'web') return;
  const dirInfo = await FileSystem.getInfoAsync(PROFILE_PHOTOS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PROFILE_PHOTOS_DIR, { intermediates: true });
  }
}

/**
 * Save a profile photo to local device storage.
 * @param sourceUri - The URI of the photo from image picker (e.g., from camera roll)
 * @param userId - The user's ID (used as filename)
 * @returns The local file path of the saved photo
 */
export async function saveProfilePhotoLocally(sourceUri: string, userId: string): Promise<string> {
  if (Platform.OS === 'web') return sourceUri; // Just use the blob/data URI on Web

  await ensureDirectoryExists();

  const fileExtension = sourceUri.split('.').pop() || 'jpg';
  const localPath = `${PROFILE_PHOTOS_DIR}${userId}.${fileExtension}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: localPath,
  });

  return localPath;
}

/**
 * Get the local URI of a user's profile photo.
 * Returns null if no photo exists.
 */
export async function getProfilePhotoUri(userId: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  await ensureDirectoryExists();

  // Check common extensions
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  for (const ext of extensions) {
    const path = `${PROFILE_PHOTOS_DIR}${userId}.${ext}`;
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      return path;
    }
  }

  return null;
}

/**
 * Delete a user's local profile photo.
 */
export async function deleteProfilePhoto(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  
  const photoUri = await getProfilePhotoUri(userId);
  if (photoUri) {
    await FileSystem.deleteAsync(photoUri, { idempotent: true });
  }
}

// ── Cloud Upload Foundation ─────────────────────────────────────────────────

/**
 * Upload profile photo to cloud storage (Supabase).
 * 
 * @param localUri - The local file path of the photo (or Blob URL on web)
 * @param userId - The user's ID
 * @returns The public URL of the uploaded photo
 */
export async function uploadProfilePhoto(localUri: string, userId: string): Promise<string> {
  try {
    const fileExt = localUri.split('.').pop() || 'jpg';
    const filePath = `${userId}-${Date.now()}.${fileExt}`;
    const response = await fetch(localUri);
    const blob = await response.blob();
    
    // Upload to Supabase 'avatar' bucket
    const { error } = await supabase.storage
      .from('avatar')
      .upload(filePath, blob, { contentType: `image/${fileExt}`, upsert: true });

    if (error) {
      console.warn('Failed to upload to Supabase, returning local URI. Error:', error.message);
      if (Platform.OS === 'web') {
        window.alert('Gagal unggah foto ke server: ' + error.message);
      } else {
        Alert.alert('Upload Gagal', error.message);
      }
      return localUri; // Fallback to local URI if upload fails or bucket doesn't exist
    }

    const { data } = supabase.storage
      .from('avatar')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err: any) {
    console.warn('Error in uploadProfilePhoto, returning local URI fallback:', err);
    if (Platform.OS === 'web') {
      window.alert('Terjadi kesalahan unggah foto: ' + err.message);
    } else {
      Alert.alert('Upload Error', err.message);
    }
    return localUri; // Fallback
  }
}

