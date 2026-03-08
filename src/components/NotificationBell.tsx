import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const NotificationBell = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }

    const fetchCount = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setUnreadCount(count || 0);
    };

    fetchCount();

    // Refresh every 30s
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <Link to="/notifications" className="relative p-2 hover:bg-muted rounded-lg transition-colors">
      <Bell className="w-5 h-5 text-foreground" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-destructive rounded-full text-[9px] text-destructive-foreground flex items-center justify-center font-bold">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
