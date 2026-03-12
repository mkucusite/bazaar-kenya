import { supabase } from '@/integrations/supabase/client';

type StorageProvider = 'supabase' | 'cloudinary' | 'r2';

interface AdminSettings {
  storage_provider: StorageProvider;
  cloudinary_cloud_name: string;
  cloudinary_upload_preset: string;
  r2_public_url: string;
  r2_access_key?: string;
  r2_secret_key?: string;
  r2_bucket_name?: string;
  [key: string]: string | undefined;
}

let cachedSettings: AdminSettings | null = null;

const DEFAULT_SETTINGS: AdminSettings = {
  storage_provider: 'supabase',
  cloudinary_cloud_name: '',
  cloudinary_upload_preset: '',
  r2_public_url: '',
};

async function getSettings(): Promise<AdminSettings> {
  if (cachedSettings) return cachedSettings;

  try {
    const { data, error } = await supabase.from('admin_settings' as any).select('key, value');
    if (error || !data) return DEFAULT_SETTINGS;

    cachedSettings = {
      ...DEFAULT_SETTINGS,
      ...(Object.fromEntries((data as any[]).map((r: any) => [r.key, r.value])) as AdminSettings),
    };

    return cachedSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function clearSettingsCache() {
  cachedSettings = null;
}

function normalizePublicUrl(url: string) {
  return url.replace(/\/+$/, '');
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

  const { data, error } = await supabase.functions.invoke('r2-presign', {
    body: { filename, contentType: file.type || 'application/octet-stream' },
  });

  if (error) throw new Error(error.message || 'Failed to get R2 presigned URL');
  if (!data?.presignedUrl) throw new Error('Invalid R2 presign response');

  const uploadRes = await fetch(data.presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
  });

  if (!uploadRes.ok) {
    const uploadErrText = await uploadRes.text();
    throw new Error(`R2 upload failed (${uploadRes.status}): ${uploadErrText || 'Unknown error'}`);
  }

  if (data.publicUrl) return data.publicUrl;
  return `${normalizePublicUrl(publicUrl)}/${filename}`;
}

async function uploadWithProvider(file: File, bucket: string): Promise<string> {
  const settings = await getSettings();
  const provider = settings.storage_provider || 'supabase';

  try {
    if (provider === 'cloudinary' && settings.cloudinary_cloud_name && settings.cloudinary_upload_preset) {
      return await uploadToCloudinary(file, settings.cloudinary_cloud_name, settings.cloudinary_upload_preset);
    }

    if (
      provider === 'r2' &&
      settings.r2_public_url &&
      settings.r2_access_key &&
      settings.r2_secret_key &&
      settings.r2_bucket_name
    ) {
      return await uploadToR2(file, settings.r2_public_url);
    }
  } catch (providerError) {
    console.warn('External storage upload failed, falling back to default storage:', providerError);
  }

  return uploadToSupabase(file, bucket);
}

export async function uploadFile(file: File, bucket: string = 'ad-images'): Promise<string> {
  return uploadWithProvider(file, bucket);
}

export async function uploadBanner(file: File): Promise<string> {
  return uploadWithProvider(file, 'banners');
}
