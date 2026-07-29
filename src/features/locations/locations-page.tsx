import { useDeferredValue, useEffect, useState } from "react";
import {
  LoaderCircle, MapPin, Search, CheckSquare, Square,
  ThumbsUp, ThumbsDown, RotateCcw, FileSignature,
  Filter, RefreshCw, Wrench, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { call } from "@/lib/api";
import { toast } from "sonner";
import { getActions, type ActionDef } from "@/lib/transitions";
import { useAuth } from "@/hooks/use-auth";
import { LeadDetailDialog } from "./lead-detail-dialog";

type LocationRecord = {
  name: string;
  business_name: string;
  business_type: string;
  address_line1: string;
  city: string;
  state: string;
  zip_code?: string;
  submitted_by: string;
  creation: string;
  modified: string;
  status: string;
  proposed_rent?: number;
};

const STATUSES = ["Pending Review", "Approved", "Rejected", "Agreement Sent", "Pending Sign", "Signed", "Installed", "Live", "Cancelled"];

export function LocationsPage() {
  const { session } = useAuth();
  const isManager = session?.is_manager ?? false;
  const currentUser = session?.user ?? "";

  const [leads, setLeads] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState(() => {
    const status = new URLSearchParams(window.location.search).get("status") || "";
    return STATUSES.includes(status) ? status : "all";
  });
  const [processing, setProcessing] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [leadDetail, setLeadDetail] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [total, setTotal] = useState(0);

  useEffect(() => { void load(); }, [page, statusFilter, deferredSearch]);
  useEffect(() => { setSelected(new Set()); }, [page, statusFilter, deferredSearch]);

  async function load() {
    setLoading(true);
    try {
      const result = await call<{ rows: LocationRecord[]; total: number }>(
        "cclms.api.portal_api_v5.list_locations",
        { page, page_size: pageSize, status: statusFilter === "all" ? undefined : statusFilter, search: deferredSearch || undefined },
        { mutation: false }
      );
      setLeads(result?.rows || []);
      setTotal(result?.total || 0);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(item: LocationRecord, action: ActionDef) {
    if (action.action === "install") {
      setLeadDetail(item.name);
      return;
    }
    setProcessing(item.name);
    try {
      const result = await call<{ success: boolean; message: string }>(
        "cclms.api.portal_api_v3.execute_action",
        { doctype: "ATM Lead", name: item.name, action: action.action },
        { mutation: true }
      );
      toast.success(result.message || `Status changed to ${action.to_status}`);
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  }

  function toggleSelect(name: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
  }

  function toggleSelectAll() {
    if (selected.size === leads.length) setSelected(new Set());
    else setSelected(new Set(leads.map((r) => r.name)));
  }
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm ring-1 ring-gray-200">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="size-5 text-zinc-600" />
                Locations
              </CardTitle>
              <CardDescription>ATM Leads — manage all location submissions</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="rounded-lg pl-8 h-8 text-sm" />
            </div>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="w-32 rounded-lg h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon-sm" onClick={load} disabled={loading}>
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><LoaderCircle className="size-5 animate-spin text-zinc-600" /></div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <MapPin className="size-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">No locations found</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 py-1.5 text-xs text-muted-foreground border-b">
                <button onClick={toggleSelectAll} className="flex items-center gap-1.5 hover:text-foreground">
                  {selected.size === leads.length ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />}
                  Select all
                </button>
                <span className="ml-auto">{total} leads</span>
              </div>

              <div className="hidden grid-cols-[1.5rem_3rem_minmax(12rem,2fr)_minmax(8rem,1fr)_minmax(7rem,1fr)_minmax(7rem,1fr)_5rem_6rem_6rem_7rem_11rem] gap-3 border-b py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground xl:grid">
                <span />
                <span>No.</span>
                <span>Business</span>
                <span>Business Type</span>
                <span>City</span>
                <span>State</span>
                <span>ZIP</span>
                <span>Created</span>
                <span>Modified</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              <div className="divide-y">
                {leads.map((item, index) => {
                  const isOwner = item.submitted_by === currentUser;
                  const actions = getActions("ATM Lead", item.status, isManager, isOwner, Boolean(session?.user));
                  const isProc = processing === item.name;
                  return (
                    <div key={item.name} className="flex items-center gap-3 py-2.5 hover:bg-muted/30 transition-colors xl:grid xl:grid-cols-[1.5rem_3rem_minmax(12rem,2fr)_minmax(8rem,1fr)_minmax(7rem,1fr)_minmax(7rem,1fr)_5rem_6rem_6rem_7rem_11rem]">
                      <button onClick={() => toggleSelect(item.name)} className="shrink-0 hover:text-foreground">
                        {selected.has(item.name) ? <CheckSquare className="size-4 text-zinc-600" /> : <Square className="size-4 text-muted-foreground" />}
                      </button>

                      <span className="hidden text-xs text-muted-foreground xl:block">{(page - 1) * pageSize + index + 1}</span>

                      <button className="min-w-0 flex-1 text-left xl:col-span-1" onClick={() => setLeadDetail(item.name)}>
                        <p className="truncate text-sm font-medium">{item.business_name || item.name}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground xl:hidden">
                          {`${item.address_line1 || ""}${item.city ? `, ${item.city}` : ""}${item.state ? `, ${item.state}` : ""}`}
                        </p>
                      </button>

                      <span className="hidden truncate text-sm text-muted-foreground xl:block">{item.business_type || "-"}</span>
                      <span className="hidden truncate text-sm text-muted-foreground xl:block">{item.city || "-"}</span>
                      <span className="hidden truncate text-sm text-muted-foreground xl:block">{item.state || "-"}</span>
                      <span className="hidden text-sm text-muted-foreground xl:block">{item.zip_code || "-"}</span>
                      <span className="hidden text-xs text-muted-foreground xl:block">{item.creation?.slice(0, 10)}</span>
                      <span className="hidden text-xs text-muted-foreground xl:block">{item.modified?.slice(0, 10)}</span>
                      <div className="hidden xl:block"><StatusBadge status={item.status} /></div>

                      {actions.length > 0 && (
                        <div className="flex shrink-0 items-center gap-1 xl:justify-end">
                          {actions.slice(0, 2).map((actionDef) => (
                            <Button
                              key={actionDef.action}
                              size="sm"
                              variant={
                                actionDef.action === "reject" ? "outline" :
                                actionDef.action === "approve" ? "outline" : "ghost"
                              }
                              className={`rounded-lg text-xs h-7 gap-1 ${
                                actionDef.action === "reject" ? "text-rose-600 border-rose-200 hover:bg-rose-50" :
                                actionDef.action === "approve" ? "text-emerald-600 border-emerald-200 hover:bg-emerald-50" : ""
                              }`}
                              disabled={isProc}
                              onClick={() => handleAction(item, actionDef)}
                            >
                              {isProc ? <LoaderCircle className="size-3 animate-spin" /> : null}
                              {actionDef.action === "approve" && <ThumbsUp className="size-3" />}
                              {actionDef.action === "reject" && <ThumbsDown className="size-3" />}
                              {actionDef.action === "sign" && <FileSignature className="size-3" />}
                              {actionDef.action === "resubmit" && <RotateCcw className="size-3" />}
                              {actionDef.action === "install" && <Wrench className="size-3" />}
                              {actionDef.action === "go_live" && <Zap className="size-3" />}
                              {actionDef.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-3 border-t pt-4 text-sm">
                <span className="text-muted-foreground">Page {page} of {pageCount}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page === pageCount || loading} onClick={() => setPage((current) => current + 1)}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <LeadDetailDialog leadName={leadDetail} open={!!leadDetail} onClose={() => setLeadDetail(null)} onUpdated={load} />
    </div>
  );
}
