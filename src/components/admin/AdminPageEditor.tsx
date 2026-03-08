import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { FileText, Loader2, Save, Sparkles } from "lucide-react";

type Page = { id: string; slug: string; title: string; content: string; updated_at: string };

const AdminPageEditor = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPages = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("site_pages").select("*").order("slug");
    setPages((data as Page[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadPages();
  }, []);

  const selectPage = (slug: string) => {
    const page = pages.find((p) => p.slug === slug);
    if (page) {
      setSelectedSlug(page.slug);
      setTitle(page.title);
      setContent(page.content);
    }
  };

  const handleSave = async () => {
    if (!selectedSlug) return;
    setSaving(true);
    const { error } = await (supabase as any)
      .from("site_pages")
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq("slug", selectedSlug);
    setSaving(false);

    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Page saved successfully" });
    await loadPages();
  };

  const handleAIEdit = async () => {
    if (!aiPrompt.trim() || !selectedSlug) return;

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-ai-chat", {
        body: {
          messages: [
            {
              role: "user",
              content: `You are editing a page titled "${title}" for KenyaAdvert (a Kenyan classifieds site). Here is the current content:\n\n${content}\n\nUser request: ${aiPrompt}\n\nReturn ONLY the updated full page content in the same markdown-like format. Do not include any explanation, just the content.`,
            },
          ],
          stream: false,
        },
      });

      if (error) throw error;

      const aiContent = typeof data?.content === "string" ? data.content.trim() : "";
      if (!aiContent) throw new Error("AI returned an empty response");

      setContent(aiContent);
      toast({ title: "AI updated the content", description: "Review and save when ready." });
    } catch (e: any) {
      toast({ title: "AI edit failed", description: e?.message || "Request failed", variant: "destructive" });
    } finally {
      setAiLoading(false);
      setAiPrompt("");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-semibold text-base flex items-center gap-2">
        <FileText className="w-4 h-4" /> Site Pages Editor
      </h2>

      <div className="flex flex-wrap gap-1.5">
        {pages.map((p) => (
          <button
            key={p.slug}
            onClick={() => selectPage(p.slug)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              selectedSlug === p.slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>

      {selectedSlug && (
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page title" className="h-10" />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="text-xs font-mono leading-relaxed"
            placeholder="Page content (markdown-like format)"
          />

          <div className="flex gap-2">
            <Input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ask AI to edit this page... e.g. 'Add a refund policy section'"
              className="h-9 text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleAIEdit()}
            />
            <Button size="sm" className="h-9" onClick={handleAIEdit} disabled={aiLoading || !aiPrompt.trim()}>
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            </Button>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full h-10">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Page
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Last updated: {pages.find((p) => p.slug === selectedSlug)?.updated_at ? new Date(pages.find((p) => p.slug === selectedSlug)!.updated_at).toLocaleString() : "—"}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminPageEditor;
