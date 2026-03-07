import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

export const initiatePayment = async (data: {
  phone: string;
  amount: number;
  package_type: string;
  ad_id?: string;
  user_id?: string;
}) => {
  const { data: result, error } = await supabase.functions.invoke("initiate-payment", {
    body: data,
  });
  if (error) throw error;
  return result;
};

export const verifyPayment = async (transactionId: string) => {
  const { data: result, error } = await supabase.functions.invoke("verify-payment", {
    body: { transaction_id: transactionId },
  });
  if (error) throw error;
  return result;
};
