import * as FileSystem from 'expo-file-system/legacy';

// ── Constants ─────────────────────────────────────────────────────────────────

const PROFILE_PHOTOS_DIR = `${FileSystem.documentDirectory}profile-photos/`;

// ── Local Storage Functions ───────────────────────────────────────────────────

/** Ensure the profile photos directory exists */
async function ensureDirectoryExists() {
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
  const photoUri = await getProfilePhotoUri(userId);
  if (photoUri) {
    await FileSystem.deleteAsync(photoUri, { idempotent: true });
  }
}

// ── Cloud Upload Foundation ─────────────────────────────────────────────────
// Pondasi untuk upload ke cloud storage (Supabase Storage, Firebase Storage, dll).
// Saat ini hanya mengembalikan path lokal. Ganti isi fungsi ini nanti
// ketika sudah memutuskan cloud storage yang akan digunakan.

/**
 * Upload profile photo to cloud storage.
 * 
 * CURRENT: Returns local path only (no cloud upload yet).
 * FUTURE: Replace the implementation with actual cloud upload
 *         (e.g., Supabase Storage, Firebase Storage, etc.)
 * 
 * @param localUri - The local file path of the photo
 * @param userId - The user's ID
 * @returns The URL/URI of the uploaded photo (currently just the local path)
 */
export async function uploadProfilePhoto(localUri: string, userId: string): Promise<string> {
  // ──────────────────────────────────────────────────────────────────────────
  // TODO: Uncomment and modify the block below when ready for cloud upload.
  //
  // Example for Supabase Storage:
  // 
  // import { supabase } from './supabase';
  //
  // const fileExt = localUri.split('.').pop() || 'jpg';
  // const filePath = `avatars/${userId}.${fileExt}`;
  // const response = await fetch(localUri);
  // const blob = await response.blob();
  //
  // const { error } = await supabase.storage
  //   .from('profile-photos')
  //   .upload(filePath, blob, { contentType: `image/${fileExt}`, upsert: true });
  //
  // if (error) throw error;
  //
  // const { data } = supabase.storage
  //   .from('profile-photos')
  //   .getPublicUrl(filePath);
  //
  // return data.publicUrl;
  // ──────────────────────────────────────────────────────────────────────────

  // For now, just return the local path
  return localUri;
}
