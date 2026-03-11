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

async function uploadToCloudinary(file: File, cloudName: string, uploadPreset: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'kenyaadverts');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST', body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Cloudinary upload failed: ${err?.error?.message || res.statusText}`);
  }
  const json = await res.json();
  return json.secure_url;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function uploadToR2(file: File): Promise<string> {
  // Get session token
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error('Session expired — please refresh and log in again');

  // Get Supabase URL from env
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
  if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is not set in environment variables');

  // Build filename — use jpg extension for test blobs
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // Convert file to base64
  const fileBase64 = await fileToBase64(file);

  const edgeFnUrl = `${supabaseUrl}/functions/v1/r2-presign`;

  let res: Response;
  try {
    res = await fetch(edgeFnUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        contentType: file.type || 'image/jpeg',
        fileBase64,
      }),
    });
  } catch (networkErr: any) {
    throw new Error(`Network error calling R2 edge function: ${networkErr.message}`);
  }

  // Parse response body regardless of status
  let body: any;
  try {
    body = await res.json();
  } catch {
    const text = await res.text().catch(() => '');
    throw new Error(`R2 proxy returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(body?.error || `R2 proxy failed with status ${res.status}`);
  }

  if (!body?.url) {
    throw new Error(`R2 proxy returned no URL. Response: ${JSON.stringify(body)}`);
  }

  return body.url;
}

export async function uploadFile(file: File, bucket: string = 'ad-images'): Promise<string> {
  const settings = await getSettings();
  const provider = settings.storage_provider || 'supabase';

  if (provider === 'cloudinary' && settings.cloudinary_cloud_name && settings.cloudinary_upload_preset) {
    return uploadToCloudinary(file, settings.cloudinary_cloud_name, settings.cloudinary_upload_preset);
  }

  if (provider === 'r2' && settings.r2_access_key && settings.r2_secret_key && settings.r2_bucket_name) {
    return uploadToR2(file);
  }

  return uploadToSupabase(file, bucket);
}

export async function uploadBanner(file: File): Promise<string> {
  const settings = await getSettings();
  const provider = settings.storage_provider || 'supabase';

  if (provider === 'cloudinary' && settings.cloudinary_cloud_name && settings.cloudinary_upload_preset) {
    return uploadToCloudinary(file, settings.cloudinary_cloud_name, settings.cloudinary_upload_preset);
  }

  if (provider === 'r2' && settings.r2_access_key && settings.r2_secret_key && settings.r2_bucket_name) {
    return uploadToR2(file);
  }

  return uploadToSupabase(file, 'banners');
}
