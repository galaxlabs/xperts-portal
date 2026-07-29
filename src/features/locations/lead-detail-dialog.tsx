import { useEffect, useState } from "react";
import { LoaderCircle, Clock, Building2, ExternalLink, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { call } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getActions, type ActionDef } from "@/lib/transitions";

const STATUS_COLORS: Record<string, string> = {
  "Pending Review": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  Approved: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  Signed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  Live: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  Installed: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400",
  Converted: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>{status}</span>;
}

export function LeadDetailDialog({
  leadName,
  open,
  onClose,
  onUpdated,
}: {
  leadName: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [scheduleInstall, setScheduleInstall] = useState(false);
  const [installDate, setInstallDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (open && leadName) {
      loadLead(leadName);
    }
  }, [open, leadName]);

  async function loadLead(name: string) {
    setLoading(true);
    setEdits({});
    setScheduleInstall(false);
    try {
      const leadRes = await call<any>("cclms.api.portal_api_v3.get_location", { name });
      setData(leadRes);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!data || Object.keys(edits).length === 0) return;
    setSaving(true);
    try {
      await call("cclms.api.portal_api_v3.update_location", {
        name: data.name,
        data: edits,
      }, { mutation: true });
      setEdits({});
      await loadLead(data.name);
      onUpdated();
      toast.success("Location updated");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAction(action: ActionDef) {
    if (!data) return;
    if (action.action === "install" && !scheduleInstall) {
      setScheduleInstall(true);
      return;
    }
    setSaving(true);
    try {
      await call("cclms.api.portal_api_v3.execute_action", {
        doctype: "ATM Lead",
        name: data.name,
        action: action.action,
        ...(action.action === "install" ? { install_date: installDate } : {}),
      }, { mutation: true });
      await loadLead(data.name);
      onUpdated();
      toast.success(`Status changed to ${action.to_status}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  function setEdit(field: string, value: string) {
    setEdits((prev) => ({ ...prev, [field]: value }));
  }

  const isOwner = data?.submitted_by === session?.user;
  const isManager = session?.is_manager ?? false;
  const actions = data ? getActions("ATM Lead", data.status, isManager, isOwner, Boolean(session?.user)) : [];
  const latitude = Number(data?.latitude);
  const longitude = Number(data?.longitude);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude) && Boolean(latitude || longitude);
  const mapUrl = hasCoordinates ? `https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}` : "";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoaderCircle className="size-6 animate-spin text-primary" />
          </div>
        ) : data ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Building2 className="size-5 text-primary" />
                <span className="truncate">{data.business_name || data.name}</span>
                <StatusBadge status={data.status} />
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Location</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="text-xs text-muted-foreground">Business Name</label>
                    <Input value={edits.business_name ?? data.business_name ?? ""} onChange={(e) => setEdit("business_name", e.target.value)} className="mt-0.5 h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Business Type</label>
                    <Input value={edits.business_type ?? data.business_type ?? ""} onChange={(e) => setEdit("business_type", e.target.value)} className="mt-0.5 h-8 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground">Address</label>
                    <Input value={edits.full_address ?? data.full_address ?? ""} onChange={(e) => setEdit("full_address", e.target.value)} className="mt-0.5 h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">City</label>
                    <Input value={edits.city ?? data.city ?? ""} onChange={(e) => setEdit("city", e.target.value)} className="mt-0.5 h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">State</label>
                    <Input value={edits.state ?? data.state ?? ""} onChange={(e) => setEdit("state", e.target.value)} className="mt-0.5 h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">ZIP</label>
                    <Input value={edits.zip_code ?? data.zip_code ?? ""} onChange={(e) => setEdit("zip_code", e.target.value)} className="mt-0.5 h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Proposed Rent ($)</label>
                    <Input value={edits.proposed_rent ?? data.proposed_rent ?? ""} onChange={(e) => setEdit("proposed_rent", e.target.value)} className="mt-0.5 h-8 text-sm" />
                  </div>
                </div>
              </div>

              {hasCoordinates && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location Map</h4>
                    <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><ExternalLink className="size-3" /> Open map</a>
                  </div>
                  <div className="overflow-hidden rounded-lg border bg-muted/20">
                    <iframe title="Location map" src={`${mapUrl}&output=embed`} className="h-52 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                    <p className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground"><MapPin className="size-3" /> {latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Notes</h4>
                <Textarea
                  value={edits.notes ?? data.notes ?? ""}
                  onChange={(e) => setEdit("notes", e.target.value)}
                  className="mt-0.5 min-h-[60px] text-sm"
                  placeholder="Add notes..."
                />
              </div>

              <div className="flex flex-wrap gap-2 border-t pt-4">
                {actions.map((actionDef) => (
                  <Button
                    key={actionDef.action}
                    size="sm"
                    className={`gap-1.5 ${actionDef.action === "approve" ? "bg-emerald-600 text-white hover:bg-emerald-700" : actionDef.action === "reject" ? "bg-rose-600 text-white hover:bg-rose-700" : ""}`}
                    disabled={saving}
                    onClick={() => handleAction(actionDef)}
                  >
                    {saving && <LoaderCircle className="size-3 animate-spin" />}
                    {actionDef.label}
                  </Button>
                ))}
                {scheduleInstall && (
                  <div className="flex w-full flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3">
                    <label className="flex flex-col gap-1 text-xs font-medium">
                      Installation date
                      <Input type="date" value={installDate} onChange={(e) => setInstallDate(e.target.value)} className="h-8" required />
                    </label>
                    <Button size="sm" disabled={saving || !installDate} onClick={() => handleAction({ action: "install", label: "Schedule Installation", icon: "wrench", to_status: "Installed" })}>
                      Schedule Installation
                    </Button>
                    <Button size="sm" variant="ghost" disabled={saving} onClick={() => setScheduleInstall(false)}>Cancel</Button>
                  </div>
                )}
                {Object.keys(edits).length > 0 && (
                  <Button size="sm" variant="default" className="gap-1.5" disabled={saving} onClick={handleSave}>
                    {saving && <LoaderCircle className="size-3 animate-spin" />}
                    Save Changes
                  </Button>
                )}
              </div>

              <div className="border-t pt-3 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                <span>Submitted: {data.creation?.slice(0, 10)}</span>
                <span>Modified: {data.modified?.slice(0, 10)}</span>
                <span>By: {data.submitted_by}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">Failed to load location</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
