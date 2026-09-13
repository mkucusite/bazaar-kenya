import { supabase } from "@/integrations/supabase/client";

export interface InitiatePaymentInput {
  phone: string;
  amount: number;
  package_type: string;
  ad_id?: string;
  banner_id?: string;
  event_id?: string;
  product_id?: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
  campaign?: {
    business_name: string;
    description?: string;
    target_url: string;
    banner_image?: string;
    county?: string | null;
    running_position?: string | null;
    party_name?: string | null;
    slogan?: string | null;
  };
}

export const initiatePayment = async (data: InitiatePaymentInput) => {
  // 1. Try Vercel Serverless Function first (direct on same origin, fast, zero CORS)
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch("/api/initiate-payment", {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (res.status !== 404) {
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success) {
        throw new Error(result.error || `Payment request failed (${res.status})`);
      }
      return result;
    }
  } catch (apiErr: any) {
    if (apiErr?.message && !apiErr.message.includes("404")) {
      throw apiErr;
    }
  }

  // 2. Fallback to Supabase Edge Function if /api was not found
  const { data: result, error } = await supabase.functions.invoke("initiate-payment", {
    body: data,
  });

  if (error) {
    if (error.message === "Edge Function returned a non-2xx status code" && result) {
      throw new Error(result.error || "Payment request failed");
    }
    throw error;
  }
  if (result && !result.success) {
    throw new Error(result.error || "Payment request failed");
  }
  return result;
};

export const verifyPayment = async (transactionId: string) => {
  // 1. Try Vercel Serverless Function first
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/verify-payment?transaction_id=${encodeURIComponent(transactionId)}`, {
      method: "GET",
      headers,
    });

    if (res.status !== 404) {
      const result = await res.json().catch(() => ({}));
      if (res.ok && result.success) {
        return result;
      }
    }
  } catch {
    // Fall back to Supabase
  }

  // 2. Fallback to Supabase Edge Function
  const { data: result, error } = await supabase.functions.invoke("verify-payment", {
    body: { transaction_id: transactionId },
  });
  if (error) throw error;
  return result;
};

export const testPalplussConnection = async (apiKey?: string) => {
  const res = await fetch("/api/palpluss-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || "PalPluss connection test failed");
  }
  return data;
};

