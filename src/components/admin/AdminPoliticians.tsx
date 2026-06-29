import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, ShieldOff, ShieldCheck, Users2 } from "lucide-react";

type ClaimRow = {
  id: string;
  business_name: string;
  user_id: string | null;
  status: string;
  admin_revoked: boolean;
  amount_paid: number | null;
  created_at: string;
  target_url: string | null;
  county: string | null;
};

type EditRequestRow = {
  id: string;
  politician_slug: string;
  submitted_by: string;
  changes: Record<string, unknown>;
  status: string;
  admin_note: string | null;
  created_at: string;
};

const AdminPoliticians = () => {
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [requests, setRequests] = useState<EditRequestRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: c } = await supabase
      .from("banner_campaigns")
      .select("id, business_name, user_id, status, admin_revoked, amount_paid, created_at, target_url, county")
      .eq("category", "politician_claim")
      .order("created_at", { ascending: false })
      .limit(200);
    setClaims((c as any) || []);
    const { data: r } = await supabase
      .from("politician_edit_requests" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setRequests((r as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleRevoke = async (row: ClaimRow) => {
    setBusyId(row.id);
    const { error } = await supabase
      .from("banner_campaigns")
      .update({ admin_revoked: !row.admin_revoked, status: !row.admin_revoked ? "cancelled" : "active" } as any)
      .eq("id", row.id);
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(!row.admin_revoked ? "Profile unclaimed" : "Profile re-activated");
    load();
  };

  const decide = async (row: EditRequestRow, accept: boolean) => {
    setBusyId(row.id);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("politician_edit_requests" as any)
      .update({
        status: accept ? "approved" : "rejected",
        reviewed_by: user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      } as any)
      .eq("id", row.id);
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(accept ? "Edit approved" : "Edit rejected");
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
        <h2 className="font-heading font-semibold text-base flex items-center gap-2"><Users2 className="w-4 h-4" /> Politician Claims ({claims.length})</h2>
        {claims.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3">No politician claims yet. Profiles cost KSh 10,000 to claim.</p>
        ) : (
          <div className="space-y-2">
            {claims.map(c => (
              <div key={c.id} className="border border-border/40 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm">{c.business_name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    c.admin_revoked ? "bg-destructive/10 text-destructive" :
                    c.status === "active" ? "bg-primary/10 text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>{c.admin_revoked ? "revoked" : c.status}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">User: {c.user_id?.slice(0,8) || "—"} · County: {c.county || "—"} · Paid: KSh {Number(c.amount_paid || 0).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</p>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant={c.admin_revoked ? "default" : "outline"} className="h-7 text-xs" disabled={busyId === c.id} onClick={() => toggleRevoke(c)}>
                    {c.admin_revoked ? <><ShieldCheck className="w-3 h-3 mr-1" /> Re-instate</> : <><ShieldOff className="w-3 h-3 mr-1" /> Force unclaim</>}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
        <h2 className="font-heading font-semibold text-base">Edit Requests ({requests.filter(r=>r.status==="pending").length} pending)</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3">No edit requests yet.</p>
        ) : (
          <div className="space-y-2">
            {requests.map(r => (
              <div key={r.id} className="border border-border/40 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm">{r.politician_slug}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    r.status === "pending" ? "bg-yellow-500/10 text-yellow-600" :
                    r.status === "approved" ? "bg-primary/10 text-primary" :
                    "bg-destructive/10 text-destructive"
                  }`}>{r.status}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Submitted by {r.submitted_by.slice(0,8)} · {new Date(r.created_at).toLocaleString()}</p>
                <pre className="text-[10px] bg-muted/40 rounded p-2 overflow-x-auto max-h-32">{JSON.stringify(r.changes, null, 2)}</pre>
                {r.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="h-7 text-xs" disabled={busyId === r.id} onClick={() => decide(r, true)}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busyId === r.id} onClick={() => decide(r, false)}>
                      <XCircle className="w-3 h-3 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPoliticians;
