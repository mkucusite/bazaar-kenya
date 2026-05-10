import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Vote, Plus, Search, Flag, Users, Building2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { optimizeImageUrl } from "@/lib/image-utils";

type Party = {
  id: string;
  name: string;
  slug: string;
  abbreviation: string | null;
  color: string | null;
  logo_url: string | null;
  description: string | null;
  website: string | null;
  is_verified: boolean;
};

type Candidate = {
  id: string;
  slug: string | null;
  business_name: string;
  banner_image: string;
  running_position: string | null;
  party_name: string | null;
  party_color: string | null;
  candidate_number: string | null;
  slogan: string | null;
};

const PoliticsPage = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [partyFilter, setPartyFilter] = useState<string>("all");
  const [registerOpen, setRegisterOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: pData }, { data: cData }] = await Promise.all([
        supabase.from("political_parties" as any).select("*").order("name"),
        supabase
          .from("banner_campaigns" as any)
          .select("id, slug, business_name, banner_image, running_position, party_name, party_color, candidate_number, slogan")
          .eq("category", "politician")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);
      setParties((pData as any) || []);
      setCandidates((cData as any) || []);
      setLoading(false);
    };
    load();
  }, []);

  const filteredCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates.filter((c) => {
      const matchesQ = !q ||
        c.business_name.toLowerCase().includes(q) ||
        (c.running_position || "").toLowerCase().includes(q) ||
        (c.party_name || "").toLowerCase().includes(q);
      const matchesParty = partyFilter === "all" ||
        (partyFilter === "independent" && !c.party_name) ||
        (c.party_name || "").toLowerCase() === partyFilter.toLowerCase();
      return matchesQ && matchesParty;
    });
  }, [candidates, search, partyFilter]);

  const candidatesByParty = useMemo(() => {
    const map = new Map<string, Candidate[]>();
    candidates.forEach((c) => {
      const key = c.party_name || "Independent";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    });
    return map;
  }, [candidates]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Politics Kenya — Aspirants, Parties & Campaigns"
        description="Browse Kenyan political aspirants by party, view manifestos, and register your political party. Politics on KenyaAdvert — the home of Kenya's campaign banners."
        canonical="https://www.kenyaadverts.com/politics"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Politics Kenya",
          description: "Kenyan political parties and aspirants directory",
          url: "https://www.kenyaadverts.com/politics",
        }}
      />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border" style={{ background: "linear-gradient(135deg, hsl(120 60% 18%) 0%, hsl(120 50% 28%) 50%, hsl(45 90% 50%) 100%)" }}>
        <div className="container-app py-12 md:py-16 text-center text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Vote className="h-3.5 w-3.5" /> Kenya Politics Hub
          </div>
          <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight">
            Aspirants. Parties. Manifestos.
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-sm md:text-base text-white/90">
            Discover Kenyan political aspirants, browse parties and read manifestos. Register your party or post a campaign banner to reach voters across all 47 counties.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-foreground hover:bg-white/90">
              <Link to="/banners/new">
                <Plus className="mr-2 h-4 w-4" /> Post a Campaign Banner
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20" onClick={() => setRegisterOpen(true)}>
              <Building2 className="mr-2 h-4 w-4" /> Register a Party
            </Button>
          </div>
        </div>
      </section>

      <main className="container-app py-8 md:py-10">
        <Tabs defaultValue="aspirants" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="aspirants"><Users className="h-4 w-4 mr-2" />Aspirants</TabsTrigger>
            <TabsTrigger value="parties"><Building2 className="h-4 w-4 mr-2" />Parties</TabsTrigger>
          </TabsList>

          {/* Aspirants */}
          <TabsContent value="aspirants" className="mt-6 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, position or party"
                  className="pl-9"
                />
              </div>
              <select
                value={partyFilter}
                onChange={(e) => setPartyFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All parties</option>
                <option value="independent">Independent</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredCandidates.length === 0 ? (
              <Card className="p-10 text-center">
                <Vote className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 font-semibold">No aspirants yet</p>
                <p className="text-sm text-muted-foreground">Be the first to publish a campaign banner.</p>
                <Button asChild className="mt-4"><Link to="/banners/new">Post your campaign</Link></Button>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCandidates.map((c) => (
                  <CandidateCard key={c.id} c={c} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Parties */}
          <TabsContent value="parties" className="mt-6">
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : parties.length === 0 ? (
              <Card className="p-10 text-center">
                <Building2 className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 font-semibold">No parties registered yet</p>
                <p className="text-sm text-muted-foreground">Register your party to be listed here.</p>
                <Button className="mt-4" onClick={() => setRegisterOpen(true)}>Register a party</Button>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {parties.map((p) => {
                  const count = candidatesByParty.get(p.name)?.length || 0;
                  return <PartyCard key={p.id} party={p} candidateCount={count} />;
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <RegisterPartyDialog open={registerOpen} onOpenChange={setRegisterOpen} onCreated={(p) => setParties((prev) => [...prev, p])} />

      <Footer />
    </div>
  );
};

const CandidateCard = ({ c }: { c: Candidate }) => {
  const color = c.party_color || "hsl(var(--primary))";
  return (
    <Link to={`/banners/${c.slug || c.id}`} className="group block">
      <Card className="overflow-hidden border-2 transition-all hover:shadow-xl" style={{ borderColor: color }}>
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          <img
            src={optimizeImageUrl(c.banner_image, 600)}
            alt={c.business_name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          {c.candidate_number && (
            <div className="absolute right-3 top-3 flex h-12 w-12 flex-col items-center justify-center rounded-xl border-2 border-white bg-white shadow-lg">
              <span className="text-[8px] font-bold uppercase" style={{ color }}>No.</span>
              <span className="text-xl font-black leading-none text-foreground">{c.candidate_number}</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <h3 className="text-lg font-black uppercase leading-tight drop-shadow-lg">{c.business_name}</h3>
            {c.running_position && <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider opacity-95">For {c.running_position}</p>}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs" style={{ background: color, color: "white" }}>
          <span className="font-bold">{c.party_name || "Independent"}</span>
          <Vote className="h-3.5 w-3.5" />
        </div>
      </Card>
    </Link>
  );
};

const PartyCard = ({ party, candidateCount }: { party: Party; candidateCount: number }) => {
  const color = party.color || "hsl(var(--primary))";
  return (
    <Card className="overflow-hidden border-2 transition-all hover:shadow-xl" style={{ borderColor: color }}>
      <div className="flex items-center gap-4 p-5" style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)` }}>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-white/40 bg-white/15 backdrop-blur">
          {party.logo_url ? (
            <img src={party.logo_url} alt={party.name} className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-7 w-7 text-white" />
          )}
        </div>
        <div className="min-w-0 flex-1 text-white">
          <h3 className="truncate text-lg font-black uppercase tracking-tight">{party.name}</h3>
          {party.abbreviation && <p className="text-xs font-bold uppercase opacity-90">{party.abbreviation}</p>}
        </div>
      </div>
      <div className="space-y-3 p-4">
        {party.description && <p className="line-clamp-2 text-sm text-muted-foreground">{party.description}</p>}
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">
            {candidateCount} {candidateCount === 1 ? "aspirant" : "aspirants"}
          </span>
          {party.website && (
            <a href={party.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
              Website <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
};

const RegisterPartyDialog = ({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: (p: Party) => void }) => {
  const [form, setForm] = useState({
    name: "",
    abbreviation: "",
    color: "#1B5E20",
    description: "",
    website: "",
    headquarters: "",
    founded_year: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!form.name.trim()) { toast.error("Party name is required"); return; }
    setSubmitting(true);
    const { data: auth } = await supabase.auth.getUser();
    const payload: any = {
      name: form.name.trim(),
      abbreviation: form.abbreviation.trim() || null,
      color: form.color,
      description: form.description.trim() || null,
      website: form.website.trim() || null,
      headquarters: form.headquarters.trim() || null,
      founded_year: form.founded_year ? Number(form.founded_year) : null,
      created_by: auth?.user?.id ?? null,
    };
    const { data, error } = await supabase.from("political_parties" as any).insert(payload).select().single();
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") toast.error("A party with this name already exists");
      else toast.error(error.message || "Could not register party");
      return;
    }
    toast.success("Party registered!");
    onCreated(data as any);
    setForm({ name: "", abbreviation: "", color: "#1B5E20", description: "", website: "", headquarters: "", founded_year: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register your political party</DialogTitle>
          <DialogDescription>Free listing. Verified parties get a badge after admin review.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Party name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wakenya United" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Abbreviation</Label>
              <Input value={form.abbreviation} onChange={(e) => setForm({ ...form, abbreviation: e.target.value })} placeholder="WU" />
            </div>
            <div>
              <Label>Party color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-14 rounded border border-input cursor-pointer" />
                <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="flex-1 font-mono text-xs" />
              </div>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does your party stand for?" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Founded year</Label>
              <Input type="number" value={form.founded_year} onChange={(e) => setForm({ ...form, founded_year: e.target.value })} placeholder="2020" />
            </div>
          </div>
          <div>
            <Label>Headquarters</Label>
            <Input value={form.headquarters} onChange={(e) => setForm({ ...form, headquarters: e.target.value })} placeholder="Nairobi" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register party"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PoliticsPage;
