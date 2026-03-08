import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ManagedAd, ManagedAdUpdate } from "./types";

interface EditAdDialogProps {
  open: boolean;
  ad: ManagedAd | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, payload: ManagedAdUpdate) => Promise<void>;
}

const EditAdDialog = ({ open, ad, saving, onOpenChange, onSave }: EditAdDialogProps) => {
  const [form, setForm] = useState<ManagedAdUpdate>({});

  useEffect(() => {
    if (!ad) return;

    setForm({
      title: ad.title,
      description: ad.description,
      price: ad.price,
      condition: ad.condition,
      county: ad.county,
      town: ad.town,
      phone: ad.phone,
      whatsapp: ad.whatsapp,
      status: ad.status,
    });
  }, [ad]);

  if (!ad) return null;

  const setField = <K extends keyof ManagedAdUpdate>(key: K, value: ManagedAdUpdate[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    await onSave(ad.id, {
      ...form,
      price: Number(form.price ?? 0),
      updated_at: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit ad</DialogTitle>
          <DialogDescription>Update your listing details and save changes.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input value={form.title || ""} onChange={(e) => setField("title", e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea
              value={form.description || ""}
              onChange={(e) => setField("description", e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Price</Label>
              <Input
                type="number"
                value={Number(form.price || 0)}
                onChange={(e) => setField("price", Number(e.target.value || 0))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Condition</Label>
              <Input value={form.condition || ""} onChange={(e) => setField("condition", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>County</Label>
              <Input value={form.county || ""} onChange={(e) => setField("county", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Town</Label>
              <Input value={form.town || ""} onChange={(e) => setField("town", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input value={form.phone || ""} onChange={(e) => setField("phone", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp || ""} onChange={(e) => setField("whatsapp", e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <select
              value={form.status || "active"}
              onChange={(e) => setField("status", e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !form.title || !form.county || !form.phone}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAdDialog;
