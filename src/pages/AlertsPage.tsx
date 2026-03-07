import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES, KENYA_COUNTIES } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";
import { Bell, Plus, Trash2, Loader2 } from "lucide-react";

const AlertsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [county, setCounty] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("alerts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setAlerts(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (!user) { navigate("/login"); return null; }

  const createAlert = async () => {
    if (!keyword.trim()) return;
    const { data, error } = await supabase.from("alerts").insert({
      user_id: user.id,
      keyword: keyword.trim(),
      category: category || null,
      county: county || null,
    } as any).select().single();
    if (!error && data) {
      setAlerts([data, ...alerts]);
      setKeyword(""); setCategory(""); setCounty("");
      toast({ title: "Alert created!" });
    }
  };

  const deleteAlert = async (id: string) => {
    await supabase.from("alerts").delete().eq("id", id);
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="section-padding py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading font-bold text-2xl text-foreground mb-6">Manage Alerts</h1>

          <div className="bg-card rounded-xl border border-border p-5 mb-8">
            <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Create New Alert</h3>
            <div className="space-y-3">
              <div>
                <Label>Keyword</Label>
                <Input placeholder='e.g. "Toyota Vitz Nairobi"' value={keyword} onChange={(e) => setKeyword(e.target.value)} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category (optional)</Label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-10 mt-1 px-3 rounded-lg border border-input bg-background text-sm">
                    <option value="">Any</option>
                    {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>County (optional)</Label>
                  <select value={county} onChange={(e) => setCounty(e.target.value)} className="w-full h-10 mt-1 px-3 rounded-lg border border-input bg-background text-sm">
                    <option value="">Any</option>
                    {KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <Button onClick={createAlert} disabled={!keyword.trim()}><Plus className="w-4 h-4 mr-1" /> Create Alert</Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No alerts yet. Create one above.</div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{alert.keyword}</p>
                      <p className="text-xs text-muted-foreground">{[alert.category, alert.county].filter(Boolean).join(" • ") || "All categories & counties"}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteAlert(alert.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
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

export default AlertsPage;
