import { supabase } from '@/integrations/supabase/client';

type StorageProvider = 'supabase' | 'cloudinary' | 'r2';

interface AdminSettings {
  storage_provider: StorageProvider;
  cloudinary_cloud_name: string;
  cloudinary_upload_preset: string;
  r2_public_url: string;
  r2_access_key: string;
  r2_secret_key: string;
  r2_bucket_name: string;
  r2_account_id: string;
  r2_endpoint: string;
  [key: string]: string;
}

let cachedSettings: AdminSettings | null = null;

async function getSettings(): Promise<AdminSettings> {
  if (cachedSettings) return cachedSettings;
  try {
    const { data, error } = await supabase.from('admin_settings' as any).select('key, value');
    if (error || !data) return { storage_provider: 'supabase' } as AdminSettings;
    cachedSettings = Object.fromEntries(
      (data as any[]).map((r: any) => [r.key, r.value])
    ) as AdminSettings;
    return cachedSettings;
  } catch {
    return { storage_provider: 'supabase' } as AdminSettings;
  }
}

export function clearSettingsCache() {
  cachedSettings = null;
}

// ─── Supabase Storage ────────────────────────────────────────────────────────

async function uploadToSupabase(file: File, bucket: string = 'ad-images'): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error(`Supabase upload failed: ${error.message}`);
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

// ─── Cloudinary ───────────────────────────────────────────────────────────────

async function uploadToCloudinary(file: File, cloudName: string, uploadPreset: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'kenyaadverts');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Cloudinary upload failed: ${err?.error?.message || res.statusText}`);
  }
  const json = await res.json();
  return json.secure_url;
}

// ─── Cloudflare R2 (via Supabase Edge Function for presigned URL) ─────────────

async function uploadToR2(file: File, publicUrl: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // Get auth token
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL not set in environment');

  // Request presigned URL from our Edge Function (which reads R2 creds securely)
  const presignRes = await fetch(`${supabaseUrl}/functions/v1/r2-presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ filename, contentType: file.type || 'image/jpeg' }),
  });

  if (!presignRes.ok) {
    const errBody = await presignRes.json().catch(() => ({ error: presignRes.statusText }));
    throw new Error(errBody?.error || `Presign request failed (${presignRes.status})`);
  }

  const { presignedUrl } = await presignRes.json();
  if (!presignedUrl) throw new Error('No presigned URL returned from server');

  // Upload directly to R2 using the presigned URL
  const uploadRes = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'image/jpeg' },
  });

  if (!uploadRes.ok) {
    const body = await uploadRes.text().catch(() => uploadRes.statusText);
    throw new Error(`R2 upload failed (${uploadRes.status}): ${body}`);
  }

  // Build final public URL
  const cleanPublicUrl = publicUrl.replace(/\/$/, '');
  return `${cleanPublicUrl}/${filename}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function uploadFile(file: File, bucket: string = 'ad-images'): Promise<string> {
  const settings = await getSettings();
  const provider = settings.storage_provider || 'supabase';

  if (
    provider === 'cloudinary' &&
    settings.cloudinary_cloud_name &&
    settings.cloudinary_upload_preset
  ) {
    try {
      return await uploadToCloudinary(file, settings.cloudinary_cloud_name, settings.cloudinary_upload_preset);
    } catch (err) {
      console.warn('Cloudinary upload failed, falling back to Supabase:', err);
      return uploadToSupabase(file, bucket);
    }
  }

  if (
    provider === 'r2' &&
    settings.r2_public_url &&
    settings.r2_access_key &&
    settings.r2_secret_key &&
    settings.r2_bucket_name
  ) {
    try {
      return await uploadToR2(file, settings.r2_public_url);
    } catch (err) {
      console.warn('R2 upload failed, falling back to Supabase:', err);
      // Re-throw so admin "Test Connection" button shows the real error
      throw err;
    }
  }

  return uploadToSupabase(file, bucket);
}

export async function uploadBanner(file: File): Promise<string> {
  const settings = await getSettings();
  const provider = settings.storage_provider || 'supabase';

  if (
    provider === 'cloudinary' &&
    settings.cloudinary_cloud_name &&
    settings.cloudinary_upload_preset
  ) {
    return uploadToCloudinary(file, settings.cloudinary_cloud_name, settings.cloudinary_upload_preset);
  }

  if (
    provider === 'r2' &&
    settings.r2_public_url &&
    settings.r2_access_key &&
    settings.r2_secret_key &&
    settings.r2_bucket_name
  ) {
    return uploadToR2(file, settings.r2_public_url);
  }

  return uploadToSupabase(file, 'banners');
}
