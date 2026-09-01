import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

/**
 * Check whether the currently signed-in user has the `admin` role.
 * Admins get a flat KSh 5 price on every payment unless disabled
 * via the `admin_flat_price_enabled` site_config key.
 */
const getAdminFlatAmount = async (): Promise<number | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return null;

    // Allow admins to disable the flat-price override from the admin dashboard
    const { data: cfg } = await supabase
      .from("site_config")
      .select("value")
      .eq("key", "admin_flat_price_enabled")
      .maybeSingle();
    if (cfg?.value === "false") return null;

    const { data: amountCfg } = await supabase
      .from("site_config")
      .select("value")
      .eq("key", "admin_flat_price_amount")
      .maybeSingle();
    const parsed = Number(amountCfg?.value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
  } catch {
    return null;
  }
};

export const initiatePayment = async (data: {
  phone: string;
  amount: number;
  package_type: string;
  ad_id?: string;
  user_id?: string;
}) => {
  const flat = await getAdminFlatAmount();
  const payload = flat !== null ? { ...data, amount: flat } : data;
  const { data: result, error } = await supabase.functions.invoke("initiate-payment", {
    body: payload,
  });
  if (error) {
    // Try to extract the actual error message from the response
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
  const { data: result, error } = await supabase.functions.invoke("verify-payment", {
    body: { transaction_id: transactionId },
  });
  if (error) throw error;
  return result;
};
