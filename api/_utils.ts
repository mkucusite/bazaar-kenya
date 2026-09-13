import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://ygwtyyitntauqdghykuf.supabase.co";
export const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnd3R5eWl0bnRhdXFkZ2h5a3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjcyODgsImV4cCI6MjEwNDY0MzI4OH0.uWY1fvA9khbEXtSfPU4ulUXu09IaJL9SYKgal-X_hNc";

export const getSupabase = () => createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export function normalizePhoneNumber(phone: string): string {
  phone = phone.trim().replace(/\D+/g, "");
  if (/^254\d{9}$/.test(phone)) return phone;
  if (/^07\d{8}$/.test(phone)) return "254" + phone.substring(1);
  if (/^011\d{7}$/.test(phone)) return "254" + phone.substring(1);
  if (/^01\d{8}$/.test(phone)) return "254" + phone.substring(1);
  if (/^\+254\d{9}$/.test(phone)) return phone.substring(1);
  return phone;
}

// PalPluss limits: accountReference <=12 chars, transactionDesc <=13 chars
export function shortRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "KA";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function shortDesc(pkg?: string): string {
  const map: Record<string, string> = {
    credits: "Credits",
    banner_basic_banner: "Banner",
    banner_creation: "Banner",
    banner_boost: "Boost",
    event_boost: "Event Boost",
    politician_promotion: "Promote",
    event_ticket: "Event Ticket",
    silver: "Silver Boost",
    gold: "Gold Boost",
    standard: "KenyaAdvert",
  };
  const key = (pkg || "standard").split(":")[0];
  const v = map[key] || "KenyaAdvert";
  return v.slice(0, 13);
}

export async function getPalplussCredentials(supabase: ReturnType<typeof getSupabase>) {
  let apiKey = process.env.PALPLUSS_API_KEY || "";
  let channelId = process.env.PALPLUSS_CHANNEL_ID || "";

  if (!apiKey) {
    // Check admin_settings
    try {
      const { data: keyRow } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "palpluss_api_key")
        .maybeSingle();
      if (keyRow?.value) apiKey = keyRow.value.trim();

      const { data: channelRow } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "palpluss_channel_id")
        .maybeSingle();
      if (channelRow?.value) channelId = channelRow.value.trim();
    } catch (e) {
      console.warn("Could not read admin_settings for PalPluss:", e);
    }
  }

  if (!apiKey) {
    // Check site_config as fallback
    try {
      const { data: scRow } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "palpluss_api_key")
        .maybeSingle();
      if (scRow?.value) apiKey = scRow.value.trim();

      const { data: scChannel } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "palpluss_channel_id")
        .maybeSingle();
      if (scChannel?.value) channelId = scChannel.value.trim();
    } catch (e) {
      console.warn("Could not read site_config for PalPluss:", e);
    }
  }

  return { apiKey, channelId };
}

export async function fulfillPayment(supabase: ReturnType<typeof getSupabase>, payment: any) {
  if (!payment) return;
  const { id, package_type, amount, user_id, ad_id, banner_id, event_id } = payment;

  // 1. Credits purchase
  if (package_type === "credits" && user_id) {
    const creditAmounts: Record<number, number> = { 5: 5, 10: 10, 20: 20, 50: 50 };
    const creditsToAdd = creditAmounts[Number(amount)] || Number(amount);
    if (creditsToAdd > 0) {
      const { data: existing } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", user_id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("credits")
          .update({ balance: existing.balance + creditsToAdd, updated_at: new Date().toISOString() })
          .eq("user_id", user_id);
      } else {
        await supabase.from("credits").insert({ user_id, balance: creditsToAdd });
      }

      await supabase.from("credit_purchases").insert({
        user_id,
        credits_amount: creditsToAdd,
        price: Number(amount),
        payment_id: id,
      });
    }
  }

  // 2. Event RSVP ticket
  if (package_type === "event_ticket") {
    await supabase.from("event_rsvps").update({ status: "confirmed" }).eq("payment_id", id);
    const { data: rsvp } = await supabase.from("event_rsvps").select("event_id").eq("payment_id", id).maybeSingle();
    if (rsvp?.event_id) {
      await supabase.rpc("increment_event_attendees" as any, { target_event_id: rsvp.event_id });
    }
  }

  // 3. Banner creation
  if (package_type === "banner_creation" && banner_id) {
    await supabase
      .from("banner_campaigns")
      .update({
        status: "active",
        payment_id: id,
        amount_paid: Number(amount || 0),
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", banner_id);
  }

  // 4. Banner boost or Politician promotion
  if ((package_type === "banner_boost" || package_type === "politician_promotion") && banner_id) {
    try {
      await supabase.rpc("apply_banner_promotion" as any, {
        target_banner_id: banner_id,
        paid_amount: Number(amount || 0),
      });
    } catch (e) {
      console.error("apply_banner_promotion rpc error:", e);
    }
    await supabase
      .from("banner_campaigns")
      .update({
        status: "active",
        payment_id: id,
        amount_paid: Number(amount || 0),
        starts_at: new Date().toISOString(),
      })
      .eq("id", banner_id);
  }

  // 5. Event boost
  if (package_type === "event_boost" && event_id) {
    try {
      await supabase.rpc("apply_event_promotion" as any, {
        target_event_id: event_id,
        paid_amount: Number(amount || 0),
      });
    } catch (e) {
      console.error("apply_event_promotion rpc error:", e);
    }
  }

  // 6. Classified ad upgrade (Silver / Gold)
  if (ad_id && (package_type === "silver" || package_type === "gold")) {
    const boostDays = package_type === "gold" ? 14 : 7;
    const expiresAt = new Date(Date.now() + boostDays * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("ads")
      .update({
        badge: package_type,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ad_id);
  }
}
