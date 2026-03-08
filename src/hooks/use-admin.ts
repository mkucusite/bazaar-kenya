import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  useEffect(() => {
    const loadRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoadingAdmin(false);
        return;
      }

      setLoadingAdmin(true);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(Boolean(data) && !error);
      setLoadingAdmin(false);
    };

    loadRole();
  }, [user]);

  return { isAdmin, loadingAdmin };
};
