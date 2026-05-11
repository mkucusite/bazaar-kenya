import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Flag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Kind = "ad" | "banner" | "event";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: Kind;
  targetId: string;
  targetName?: string;
  onReported?: () => void;
}

const REASONS = [
  "Inappropriate or offensive content",
  "Scam or fraudulent",
  "Misleading information",
  "Hate speech or harassment",
  "Duplicate or spam",
  "Wrong category",
  "Other",
];

function getReporterIdentifier() {
  const k = "ka_reporter_id";
  let v = localStorage.getItem(k);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(k, v);
  }
  return v;
}

const ReportDialog = ({ open, onOpenChange, kind, targetId, targetName, onReported }: ReportDialogProps) => {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const fullReason = details.trim() ? `${reason} — ${details.trim().slice(0, 500)}` : reason;
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id ?? null;
    const reporterIdentifier = getReporterIdentifier();

    let error;
    if (kind === "ad") {
      ({ error } = await supabase.from("ad_reports" as any).insert({
        ad_id: targetId,
        reporter_id: uid,
        reason: fullReason,
      } as any));
    } else if (kind === "event") {
      ({ error } = await supabase.from("event_reports" as any).insert({
        event_id: targetId,
        reporter_id: uid,
        reporter_identifier: reporterIdentifier,
        reason: fullReason,
      } as any));
    } else {
      ({ error } = await supabase.from("banner_reports" as any).insert({
        banner_id: targetId,
        reporter_id: uid,
        reporter_identifier: reporterIdentifier,
        reason: fullReason,
      } as any));
    }
    setSubmitting(false);

    if (error) {
      // Treat duplicate (unique violation) as success — already reported
      if (error.code === "23505") {
        toast.success("Already reported. Admins will review shortly.");
        onOpenChange(false);
        return;
      }
      toast.error(error.message || "Could not submit report");
      return;
    }
    toast.success("Thanks — this listing has been hidden pending admin review.");
    setDetails("");
    onOpenChange(false);
    onReported?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-destructive" /> Report {kind}
          </DialogTitle>
          <DialogDescription>
            {targetName ? `Tell us what's wrong with "${targetName}". ` : ""}
            Reported items are hidden immediately and reviewed by an admin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-1.5">
            {REASONS.map((r) => (
              <div key={r} className="flex items-center gap-2">
                <RadioGroupItem value={r} id={`reason-${r}`} />
                <Label htmlFor={`reason-${r}`} className="text-sm font-normal cursor-pointer">{r}</Label>
              </div>
            ))}
          </RadioGroup>

          <Textarea
            placeholder="Additional details (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            maxLength={500}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
