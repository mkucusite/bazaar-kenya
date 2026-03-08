import { supabase } from "@/integrations/supabase/client";

// Log auth events to login_logs table
export const logAuthEvent = async (
  eventType: "login" | "login_failed" | "signup" | "logout",
  email?: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && eventType !== "login_failed" && eventType !== "signup") return;

    await supabase.from("login_logs").insert({
      user_id: user?.id || null,
      email: email || user?.email || null,
      event_type: eventType,
      user_agent: navigator.userAgent,
      ip_address: null, // Can't get client IP from browser; logged server-side if needed
    } as any);
  } catch {
    // Silent fail - don't break auth flow for logging
  }
};

// Sanitize text input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) && email.length <= 255;
};

// Validate phone (Kenyan format)
export const isValidPhone = (phone: string): boolean => {
  const re = /^(?:0|\+?254)\d{9}$/;
  return re.test(phone.replace(/\s/g, ""));
};
