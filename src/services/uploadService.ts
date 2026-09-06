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
  // Watermark first so stored originals carry the brand mark.
  const prepared = await applyWatermark(file);
  const ext = prepared.name.split('.').pop() || 'webp';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, prepared, {
      cacheControl: '31536000',
      upsert: false,
      contentType: prepared.type || 'image/webp',
    });

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

async function applyWatermark(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const logo = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      logo.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Logo size: 20% of image width, max 200px
        const logoWidth = Math.min(img.width * 0.2, 200);
        const logoHeight = (logo.height / logo.width) * logoWidth;

        // Position: bottom right with 10px padding
        const padding = 10;
        const x = img.width - logoWidth - padding;
        const y = img.height - logoHeight - padding;

        // Draw with 70% opacity
        ctx.globalAlpha = 0.7;
        ctx.drawImage(logo, x, y, logoWidth, logoHeight);
        ctx.globalAlpha = 1.0;

        URL.revokeObjectURL(objectUrl);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const watermarked = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
              type: 'image/webp',
            });
            resolve(watermarked);
          },
          'image/webp',
          0.85,
        );
      };

      logo.onerror = () => resolve(file); // fallback: upload without watermark
      logo.src = '/watermark-logo.png';
    };

    img.onerror = () => resolve(file);
    img.src = objectUrl;
  });
}

async function uploadToR2(file: File, publicUrl: string): Promise<string> {
  // Apply watermark before uploading
  const watermarkedFile = await applyWatermark(file);
  file = watermarkedFile;

  const ext = file.name.split('.').pop() || 'webp';
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

    if (provider === 'r2') {
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
