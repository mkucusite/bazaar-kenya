import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import RichDescriptionEditor from "@/components/RichDescriptionEditor";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Eye, ImagePlus, Loader2, PenLine, PlusCircle, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/services/uploadService";

type EventItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  gallery_images?: string[] | null;
  start_at: string;
  location: string | null;
  host_name: string | null;
  views_count?: number;
  is_published?: boolean;
};

const MyEventsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [form, setForm] = useState({ title: "", description: "", location: "", host_name: "" });
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login?redirect=/my-events"); return; }
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("events" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      setEvents((data as any) || []);
      setLoading(false);
    };
    load();
  }, [user, authLoading, navigate]);

  const openEdit = (event: EventItem) => {
    setEditing(event);
    setForm({ title: event.title || "", description: event.description || "", location: event.location || "", host_name: event.host_name || "" });
    setPreviews((event.gallery_images && event.gallery_images.length > 0) ? event.gallery_images.slice(0, 3) : (event.cover_image ? [event.cover_image] : []));
    setFiles([]);
  };

  const saveEvent = async () => {
    if (!user || !editing || !form.title.trim()) return;
    setSaving(true);
    try {
      let gallery = previews.slice(0, 3);
      if (files.length > 0) {
        gallery = [];
        for (const file of files) {
          gallery.push(await uploadFile(file, "events"));
        }
      }
      const payload = { ...form, description: form.description.trim() || null, location: form.location.trim() || null, host_name: form.host_name.trim() || null, cover_image: gallery[0] || editing.cover_image, gallery_images: gallery };
      const { data, error } = await supabase.from("events" as any).update(payload as any).eq("id", editing.id).eq("user_id", user.id).select("*").single();
      if (error) throw error;
      setEvents((prev) => prev.map((item) => item.id === editing.id ? (data as any) : item));
      setEditing(null);
      toast.success("Event updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update event");
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (event: EventItem) => {
    if (!confirm(`Delete "${event.title}"?`)) return;
    const { error } = await supabase.from("events" as any).delete().eq("id", event.id).eq("user_id", user?.id);
    if (error) { toast.error(error.message); return; }
    setEvents((prev) => prev.filter((item) => item.id !== event.id));
    toast.success("Event deleted");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="My Events" description="Manage your events." canonical="https://www.kenyaadverts.com/my-events" robots="noindex, follow" />
      <Navbar />
      <main className="container-app py-6 md:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">My Events</h1>
          <Button onClick={() => navigate("/events/new")}><PlusCircle className="mr-2 h-4 w-4" />New Event</Button>
        </div>
        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : events.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center"><Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><p className="mb-4 text-sm text-muted-foreground">No events yet.</p><Button onClick={() => navigate("/events/new")}>Create Event</Button></div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div key={event.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <img src={event.cover_image || "/placeholder.svg"} alt={event.title} className="aspect-[16/10] w-full object-cover" loading="lazy" />
                <div className="space-y-3 p-4">
                  <h2 className="line-clamp-2 font-bold">{event.title}</h2>
                  <p className="text-xs text-muted-foreground">{new Date(event.start_at).toLocaleDateString("en-KE")} · {(event.views_count || 0).toLocaleString()} visits</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/events/${event.slug}`)}><Eye className="mr-1.5 h-3.5 w-3.5" />View</Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(event)}><PenLine className="mr-1.5 h-3.5 w-3.5" />Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteEvent(event)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit event</DialogTitle></DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <label className="relative block aspect-[16/9] cursor-pointer overflow-hidden rounded-md border border-border bg-muted">
              {previews[0] ? <img src={previews[0]} alt="Event" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><ImagePlus className="h-8 w-8" /></div>}
              <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0" onChange={(e) => { const next = Array.from(e.target.files || []).slice(0, 3); setFiles(next); setPreviews(next.map((file) => URL.createObjectURL(file))); }} />
            </label>
            <div className="flex gap-2 overflow-x-auto">{previews.map((src, index) => <div key={`${src}-${index}`} className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md border border-border"><img src={src} alt="" className="h-full w-full object-cover" /><button type="button" onClick={() => { setPreviews((prev) => prev.filter((_, i) => i !== index)); setFiles((prev) => prev.filter((_, i) => i !== index)); }} className="absolute right-1 top-1 rounded-full bg-background/90 p-1"><X className="h-3 w-3" /></button></div>)}</div>
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><RichDescriptionEditor value={form.description} onChange={(description) => setForm({ ...form, description })} /></div>
            <div className="grid gap-3 sm:grid-cols-2"><div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div><div><Label>Host</Label><Input value={form.host_name} onChange={(e) => setForm({ ...form, host_name: e.target.value })} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button><Button onClick={saveEvent} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default MyEventsPage;
