import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { clearSettingsCache, uploadFile } from "@/services/uploadService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, CheckCircle, AlertTriangle, RotateCcw } from "lucide-react";

type Provider = "supabase" | "cloudinary" | "r2";

const AdminStorageCDN = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [provider, setProvider] = useState<Provider>("supabase");
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState("");
  const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState("");
  const [r2AccountId, setR2AccountId] = useState("");
  const [r2AccessKey, setR2AccessKey] = useState("");
  const [r2SecretKey, setR2SecretKey] = useState("");
  const [r2BucketName, setR2BucketName] = useState("");
  const [r2PublicUrl, setR2PublicUrl] = useState("");
  const [r2Endpoint, setR2Endpoint] = useState("");
  const [showR2Secret, setShowR2Secret] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from("admin_settings" as any).select("key, value");
    if (data) {
      const map: Record<string, string> = Object.fromEntries((data as any[]).map((r: any) => [r.key, r.value]));
      setProvider((map.storage_provider as Provider) || "supabase");
      setCloudinaryCloudName(map.cloudinary_cloud_name || "");
      setCloudinaryUploadPreset(map.cloudinary_upload_preset || "");
      setR2AccountId(map.r2_account_id || "");
      setR2AccessKey(map.r2_access_key || "");
      setR2SecretKey(map.r2_secret_key || "");
      setR2BucketName(map.r2_bucket_name || "");
      setR2PublicUrl(map.r2_public_url || "");
      setR2Endpoint(map.r2_endpoint || "");
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    const settings: Record<string, string> = {
      storage_provider: provider,
      cloudinary_cloud_name: cloudinaryCloudName,
      cloudinary_upload_preset: cloudinaryUploadPreset,
      r2_account_id: r2AccountId,
      r2_access_key: r2AccessKey,
      r2_secret_key: r2SecretKey,
      r2_bucket_name: r2BucketName,
      r2_public_url: r2PublicUrl,
      r2_endpoint: r2Endpoint || (r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : ""),
    };

    for (const [key, value] of Object.entries(settings)) {
      await supabase.from("admin_settings" as any).upsert({ key, value, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
    }

    clearSettingsCache();
    setSaving(false);
    toast({ title: "Storage settings saved!" });
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      // Create a tiny test file
      const blob = new Blob(["test"], { type: "text/plain" });
      const file = new File([blob], "test-connection.txt", { type: "text/plain" });
      const url = await uploadFile(file);
      toast({ title: "Connection successful!", description: `Test file uploaded: ${url.slice(0, 60)}...` });
    } catch (err: any) {
      toast({ title: "Connection test failed", description: err.message, variant: "destructive" });
    }
    setTesting(false);
  };

  const resetToDefault = async () => {
    setProvider("supabase");
    await supabase.from("admin_settings" as any).upsert({ key: "storage_provider", value: "supabase", updated_at: new Date().toISOString() } as any, { onConflict: "key" });
    clearSettingsCache();
    toast({ title: "Reset to Supabase Storage" });
  };

  const hasWarning = (provider === "cloudinary" && (!cloudinaryCloudName || !cloudinaryUploadPreset)) ||
    (provider === "r2" && (!r2AccessKey || !r2SecretKey || !r2BucketName));

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      {/* Active provider badge */}
      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <span className="text-sm font-medium text-foreground">Active: {provider === "supabase" ? "Supabase Storage" : provider === "cloudinary" ? "Cloudinary" : "Cloudflare R2"}</span>
      </div>

      {hasWarning && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
          <p className="text-xs text-yellow-700">Selected provider has missing credentials. Uploads will fall back to Supabase Storage.</p>
        </div>
      )}

      {/* Provider selector */}
      <div>
        <label className="text-xs font-medium text-foreground block mb-1.5">Storage Provider</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="supabase">Supabase Storage (Default)</option>
          <option value="cloudinary">Cloudinary</option>
          <option value="r2">Cloudflare R2</option>
        </select>
      </div>

      {/* Cloudinary fields */}
      {provider === "cloudinary" && (
        <div className="space-y-3 border border-border/60 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground">Cloudinary Settings</h3>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Cloud Name</label>
            <Input value={cloudinaryCloudName} onChange={(e) => setCloudinaryCloudName(e.target.value)} placeholder="your-cloud-name" className="h-9" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Upload Preset (unsigned)</label>
            <Input value={cloudinaryUploadPreset} onChange={(e) => setCloudinaryUploadPreset(e.target.value)} placeholder="your-upload-preset" className="h-9" />
            <p className="text-[10px] text-muted-foreground mt-1">Create an unsigned upload preset in Cloudinary → Settings → Upload</p>
          </div>
        </div>
      )}

      {/* R2 fields */}
      {provider === "r2" && (
        <div className="space-y-3 border border-border/60 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground">Cloudflare R2 Settings</h3>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Account ID</label>
            <Input value={r2AccountId} onChange={(e) => setR2AccountId(e.target.value)} placeholder="Your Cloudflare Account ID" className="h-9" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Access Key ID</label>
            <Input value={r2AccessKey} onChange={(e) => setR2AccessKey(e.target.value)} placeholder="Access Key" className="h-9" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Secret Access Key</label>
            <div className="relative">
              <Input
                type={showR2Secret ? "text" : "password"}
                value={r2SecretKey}
                onChange={(e) => setR2SecretKey(e.target.value)}
                placeholder="Secret Key"
                className="h-9 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowR2Secret(!showR2Secret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showR2Secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Bucket Name</label>
            <Input value={r2BucketName} onChange={(e) => setR2BucketName(e.target.value)} placeholder="my-bucket" className="h-9" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Public URL</label>
            <Input value={r2PublicUrl} onChange={(e) => setR2PublicUrl(e.target.value)} placeholder="https://pub-xxx.r2.dev" className="h-9" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">R2 Endpoint</label>
            <Input
              value={r2Endpoint}
              onChange={(e) => setR2Endpoint(e.target.value)}
              placeholder={r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : "Auto-filled from Account ID"}
              className="h-9"
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={saveSettings} disabled={saving} className="h-9">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          Save Settings
        </Button>
        <Button variant="outline" onClick={testConnection} disabled={testing} className="h-9">
          {testing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          Test Connection
        </Button>
        <Button variant="ghost" onClick={resetToDefault} className="h-9">
          <RotateCcw className="w-4 h-4 mr-1" /> Reset to Default
        </Button>
      </div>
    </div>
  );
};

export default AdminStorageCDN;
