import { useState, useEffect } from "react";
import SEOHead from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Bell, Check, Loader2 } from "lucide-react";

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setNotifications(data || []);
      setLoading(false);
    };
    fetchNotifs();
  }, [user]);

  if (!user) { navigate("/login"); return null; }

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true } as any).eq("user_id", user.id).eq("is_read", false);
    setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-heading font-bold text-xl text-foreground">Notifications</h1>
            <Button variant="outline" size="sm" onClick={markAllRead} className="h-8 text-xs"><Check className="w-3.5 h-3.5 mr-1" /> Mark all read</Button>
          </div>
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-xl border border-border/60">
              <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className={`p-4 rounded-xl border border-border/60 cursor-pointer hover:bg-muted/50 transition-colors ${n.is_read ? "bg-card" : "bg-primary/5"}`} onClick={() => n.link && navigate(n.link)}>
                  <p className="font-medium text-sm text-foreground">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-1">{n.body}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotificationsPage;
