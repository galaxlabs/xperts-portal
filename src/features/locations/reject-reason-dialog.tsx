import { useEffect, useState } from "react";
import { LoaderCircle, ThumbsDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { call } from "@/lib/api";
import { toast } from "sonner";

export function RejectReasonDialog({
  leadName,
  action,
  toStatus,
  reasonOptions,
  open,
  onClose,
  onDone,
}: {
  leadName: string;
  action: string;
  toStatus: string;
  reasonOptions?: string[];
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [other, setOther] = useState("");
  const [saving, setSaving] = useState(false);
  const options = reasonOptions && reasonOptions.length > 0
    ? reasonOptions
    : ["Not Interested", "Out of Space", "Other"];

  useEffect(() => {
    if (open) {
      setReason("");
      setOther("");
    }
  }, [open]);

  async function submit() {
    if (!reason) {
      toast.error("Please select a reject reason");
      return;
    }
    if (reason === "Other" && !other.trim()) {
      toast.error("Please write the reason");
      return;
    }
    setSaving(true);
    try {
      await call("cclms.api.portal_api_v3.execute_action", {
        doctype: "ATM Lead",
        name: leadName,
        action,
        reject_reason: reason,
        reject_reason_other: reason === "Other" ? other.trim() : "",
      }, { mutation: true });
      toast.success(`Status changed to ${toStatus}`);
      onDone();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ThumbsDown className="size-5 text-rose-600" />
            Reject Location
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Reject Reason</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1 w-full h-8 text-sm rounded-lg">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {reason === "Other" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Write the reason</label>
              <Textarea
                value={other}
                onChange={(e) => setOther(e.target.value)}
                className="mt-1 min-h-[80px] text-sm"
                placeholder="Describe why this location is being rejected..."
              />
            </div>
          )}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="ghost" size="sm" disabled={saving} onClick={onClose}>Cancel</Button>
            <Button size="sm" className="gap-1.5 bg-rose-600 text-white hover:bg-rose-700" disabled={saving} onClick={() => void submit()}>
              {saving && <LoaderCircle className="size-3 animate-spin" />}
              Confirm Reject
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
