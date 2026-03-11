import { supabase } from '@/integrations/supabase/client';

type StorageProvider = 'supabase' | 'cloudinary' | 'r2';

interface AdminSettings {
  storage_provider: StorageProvider;
  cloudinary_cloud_name: string;
  cloudinary_upload_preset: string;
  r2_public_url: string;
  [key: string]: string;
}

let cachedSettings: AdminSettings | null = null;

async function getSettings(): Promise<AdminSettings> {
  if (cachedSettings) return cachedSettings;
  try {
    const { data, error } = await supabase.from('admin_settings' as any).select('key, value');
    if (error || !data) return { storage_provider: 'supabase' } as AdminSettings;
    cachedSettings = Object.fromEntries((data as any[]).map((r: any) => [r.key, r.value])) as AdminSettings;
    return cachedSettings;
  } catch {
    return { storage_provider: 'supabase' } as AdminSettings;
  }
}

export function clearSettingsCache() {
  cachedSettings = null;
}

async function uploadToSupabase(file: File, bucket: string = 'ad-images'): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

async function uploadToCloudinary(file: File, cloudName: string, uploadPreset: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'kenyaadverts');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Cloudinary upload failed');
  const json = await res.json();
  return json.secure_url;
}

async function uploadToR2(file: File, publicUrl: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data: session } = await supabase.auth.getSession();
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r2-presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ filename, contentType: file.type }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Failed to get R2 presigned URL: ${errBody}`);
  }
  const { presignedUrl, contentType } = await res.json();
  
  const uploadRes = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': contentType || file.type },
  });
  if (!uploadRes.ok) {
    throw new Error(`R2 upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
  }
  return `${publicUrl}/${filename}`;
}

export async function uploadFile(file: File, bucket: string = 'ad-images'): Promise<string> {
  const settings = await getSettings();
  const provider = settings.storage_provider || 'supabase';

  if (provider === 'cloudinary' && settings.cloudinary_cloud_name && settings.cloudinary_upload_preset) {
    return uploadToCloudinary(file, settings.cloudinary_cloud_name, settings.cloudinary_upload_preset);
  }
  if (provider === 'r2' && settings.r2_public_url) {
    return uploadToR2(file, settings.r2_public_url);
  }
  return uploadToSupabase(file, bucket);
}

export async function uploadBanner(file: File): Promise<string> {
  const settings = await getSettings();
  const provider = settings.storage_provider || 'supabase';

  if (provider === 'cloudinary' && settings.cloudinary_cloud_name && settings.cloudinary_upload_preset) {
    return uploadToCloudinary(file, settings.cloudinary_cloud_name, settings.cloudinary_upload_preset);
  }
  if (provider === 'r2' && settings.r2_public_url) {
    return uploadToR2(file, settings.r2_public_url);
  }
  return uploadToSupabase(file, 'banners');
}
