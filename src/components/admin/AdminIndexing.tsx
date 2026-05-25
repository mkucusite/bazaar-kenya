import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Send, CheckCircle2, XCircle, Clock, ExternalLink, Activity } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type UrlRow = {
  id: string;
  url: string;
  status: "indexed" | "not_indexed" | "pending" | "error";
  last_checked: string | null;
  last_pinged: string | null;
  ping_count: number | null;
  inspection_result: any;
  updated_at: string | null;
};

type UsageRow = { day: string; gsc_calls: number; ping_calls: number };

const GSC_DAILY_LIMIT = 200;
type Filter = "all" | "indexed" | "not_indexed" | "pending";

const AdminIndexing = () => {
  const [rows, setRows] = useState<UrlRow[]>([]);
  const [usage, setUsage] = useState<UsageRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [bulkPinging, setBulkPinging] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [lastScan, setLastScan] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const [urlsRes, usageRes] = await Promise.all([
      supabase.from("seo_url_index" as any).select("*").order("updated_at", { ascending: false }).limit(500),
      supabase.from("seo_api_usage" as any).select("*").eq("day", today).maybeSingle(),
    ]);
    const list = ((urlsRes.data || []) as any) as UrlRow[];
    setRows(list);
    setUsage((usageRes.data as any) || { day: today, gsc_calls: 0, ping_calls: 0 });
    setLastScan(list.reduce<string | null>((acc, r) => (r.last_checked && (!acc || r.last_checked > acc) ? r.last_checked : acc), null));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  const counts = useMemo(() => ({
    all: rows.length,
    indexed: rows.filter((r) => r.status === "indexed").length,
    not_indexed: rows.filter((r) => r.status === "not_indexed").length,
    pending: rows.filter((r) => r.status === "pending").length,
  }), [rows]);

  const runScan = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("seo-url-scan", { body: { mode: "scan" } });
      if (error) throw error;
      toast({ title: "Scan complete", description: `Checked ${data?.checked ?? 0} URLs · Indexed: ${data?.indexed ?? 0} · Not: ${data?.not_indexed ?? 0}` });
      await load();
    } catch (err: any) {
      toast({ title: "Scan failed", description: err.message, variant: "destructive" });
    } finally { setScanning(false); }
  };

  const pingUrl = async (id: string, url: string) => {
    setPingingId(id);
    try {
      const { data, error } = await supabase.functions.invoke("seo-url-scan", { body: { mode: "ping", url } });
      if (error) throw error;
      toast({ title: data?.ok ? "Ping sent" : "Ping skipped", description: data?.message || url });
      await load();
    } catch (err: any) {
      toast({ title: "Ping failed", description: err.message, variant: "destructive" });
    } finally { setPingingId(null); }
  };

  const pingAllUnindexed = async () => {
    setBulkPinging(true);
    try {
      const { data, error } = await supabase.functions.invoke("seo-url-scan", { body: { mode: "ping_unindexed" } });
      if (error) throw error;
      toast({ title: "Bulk ping complete", description: `Pinged ${data?.pinged ?? 0} URLs (skipped ${data?.skipped ?? 0})` });
      await load();
    } catch (err: any) {
      toast({ title: "Bulk ping failed", description: err.message, variant: "destructive" });
    } finally { setBulkPinging(false); }
  };

  const fmt = (d: string | null) => d ? new Date(d).toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" }) : "—";
  const gscUsed = usage?.gsc_calls ?? 0;
  const gscPct = Math.min(100, Math.round((gscUsed / GSC_DAILY_LIMIT) * 100));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-heading font-semibold text-base flex items-center gap-2"><Activity className="w-4 h-4" /> Indexing Dashboard</h2>
          <p className="text-xs text-muted-foreground">Last scan: <span className="font-medium text-foreground">{fmt(lastScan)}</span></p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>
          <Button size="sm" onClick={runScan} disabled={scanning}>{scanning ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />} Scan Now</Button>
          <Button size="sm" variant="secondary" onClick={pingAllUnindexed} disabled={bulkPinging || counts.not_indexed === 0}>
            {bulkPinging ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />} Ping All Unindexed ({counts.not_indexed})
          </Button>
        </div>
      </div>

      {/* API usage bar */}
      <div className="bg-card border border-border/60 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="font-medium">Google Indexing API — Today</span>
          <span className="text-muted-foreground">{gscUsed} / {GSC_DAILY_LIMIT}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className={`h-full ${gscPct > 90 ? "bg-destructive" : gscPct > 70 ? "bg-gold" : "bg-primary"}`} style={{ width: `${gscPct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">Indexing API pings today: <span className="font-medium text-foreground">{usage?.ping_calls ?? 0}</span></p>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "not_indexed", "indexed", "pending"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border/40 hover:bg-primary/10"}`}>
            {f === "all" ? "Show All" : f === "not_indexed" ? "Not Indexed Only" : f === "indexed" ? "Indexed Only" : "Pending"} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">URL</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Last Checked</th>
                <th className="text-left p-3">Last Pinged</th>
                <th className="text-right p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin inline" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No URLs yet — click <strong>Scan Now</strong> to discover and index your pages.</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-t border-border/40 hover:bg-muted/20">
                  <td className="p-3 max-w-[320px]">
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate flex items-center gap-1">
                      <span className="truncate">{r.url.replace(/^https?:\/\//, "")}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </td>
                  <td className="p-3">
                    {r.status === "indexed" && <span className="inline-flex items-center gap-1 text-emerald-600 font-medium"><CheckCircle2 className="w-4 h-4" /> Indexed</span>}
                    {r.status === "not_indexed" && <span className="inline-flex items-center gap-1 text-destructive font-medium"><XCircle className="w-4 h-4" /> Not Indexed</span>}
                    {r.status === "pending" && <span className="inline-flex items-center gap-1 text-amber-600 font-medium"><Clock className="w-4 h-4" /> Pending</span>}
                    {r.status === "error" && <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">Error</span>}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{fmt(r.last_checked)}</td>
                  <td className="p-3 text-xs text-muted-foreground">{fmt(r.last_pinged)} {r.ping_count ? <span className="opacity-60">·{r.ping_count}</span> : null}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => pingUrl(r.id, r.url)} disabled={pingingId === r.id}>
                      {pingingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminIndexing;
