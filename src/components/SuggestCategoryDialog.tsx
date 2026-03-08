import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Lightbulb, Loader2 } from "lucide-react";
import { CATEGORIES } from "@/data/mockData";

const SuggestCategoryDialog = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [parentCat, setParentCat] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);

    const { error } = await supabase.from("category_suggestions" as any).insert({
      user_id: user.id,
      category_name: name.trim(),
      parent_category_id: parentCat || null,
      note: note.trim() || null,
    } as any);

    setSaving(false);
    if (error) {
      toast({ title: "Failed to submit suggestion", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Category suggestion submitted!", description: "An admin will review it shortly." });
    setName("");
    setParentCat("");
    setNote("");
    setOpen(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Lightbulb className="w-3.5 h-3.5" />
          Suggest Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Suggest a New Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Category Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pet Supplies" required />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Parent Category (optional)</label>
            <select
              value={parentCat}
              onChange={(e) => setParentCat(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
            >
              <option value="">None (new top-level category)</option>
              {CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Note (optional)</label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why this category is needed..." rows={2} />
          </div>
          <Button type="submit" disabled={saving || !name.trim()} className="w-full">
            {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Submit Suggestion
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestCategoryDialog;
