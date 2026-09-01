import { supabase } from "@/integrations/supabase/client";

export const initiatePayment = async (data: {
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
}) => {
  const { data: result, error } = await supabase.functions.invoke("initiate-payment", {
    body: data,
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
