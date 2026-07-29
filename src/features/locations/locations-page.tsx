import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight, Columns3, LayoutList, LoaderCircle,
  MapPin, RefreshCw, Search, ThumbsDown, ThumbsUp, Wrench, Zap,
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
  business_type?: string;
  full_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  status: string;
  creation?: string;
  modified?: string;
};

type Cache = { syncedAt: string; rows: LocationRecord[] };

const STATUSES = ["Pending Review", "Approved", "Rejected", "Signed", "Installed", "Converted"];
const KANBAN_STATUSES = STATUSES;
const PAGE_SIZE = 25;

function actionColor(action: string) {
  if (action === "approve") return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
  if (action === "reject") return "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100";
  return "";
}

function cacheKey(companies: string[]) {
  return `xperts-location-cache:v4:${companies.slice().sort().join("|")}`;
}

function readCache(key: string): Cache | null {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function LocationsPage() {
  const { session } = useAuth();
  const [rows, setRows] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState(() => {
    const status = new URLSearchParams(window.location.search).get("status") || "";
    return STATUSES.includes(status) ? status : "all";
  });
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [processing, setProcessing] = useState<string | null>(null);
  const [leadDetail, setLeadDetail] = useState<string | null>(null);
  const companies = session?.companies || (session?.company ? [session.company] : []);

  useEffect(() => { void sync(); }, [session?.user]);

  async function sync() {
    if (!companies.length) return;
    const key = cacheKey(companies);
    const cached = readCache(key);
    if (cached) {
      setRows(cached.rows);
      setLoading(false);
    }
    setSyncing(true);
    try {
      const update = await call<{ rows: LocationRecord[]; removed: string[]; synced_at: string }>(
        "cclms.api.portal_api_v6.sync_locations",
        { since: cached?.syncedAt },
        { mutation: false }
      );
      const merged = new Map((cached?.rows || []).map((row) => [row.name, row]));
      for (const name of update.removed || []) merged.delete(name);
      for (const row of update.rows || []) merged.set(row.name, row);
      const nextRows = [...merged.values()].toSorted((a, b) => (b.modified || "").localeCompare(a.modified || ""));
      setRows(nextRows);
      localStorage.setItem(key, JSON.stringify({ syncedAt: update.synced_at, rows: nextRows }));
    } catch (error: any) {
      if (!cached) toast.error(error.message);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }

  const filteredRows = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!query) return true;
      return [row.business_name, row.business_type, row.full_address, row.city, row.state, row.zip_code]
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [rows, statusFilter, deferredSearch]);
  const suggestions = useMemo(() => [...new Set(rows.flatMap((row) => [row.business_name, row.business_type, row.full_address, row.city, row.state, row.zip_code]).filter((value): value is string => Boolean(value)))].slice(0, 100), [rows]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  async function handleAction(item: LocationRecord, action: ActionDef) {
    if (action.action === "install") {
      setLeadDetail(item.name);
      toast.message("Choose an installation date in the location details.");
      return;
    }
    setProcessing(item.name);
    try {
      const result = await call<{ message?: string }>("cclms.api.portal_api_v3.execute_action", {
        doctype: "ATM Lead", name: item.name, action: action.action,
      }, { mutation: true });
      toast.success(result.message || `Status changed to ${action.to_status}`);
      await sync();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessing(null);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoaderCircle className="size-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm ring-1 ring-gray-200">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><CardTitle className="flex items-center gap-2 text-lg"><MapPin className="size-5 text-zinc-600" /> Locations</CardTitle><CardDescription>Cached location intelligence with delta sync</CardDescription></div>
            <div className="flex gap-1"><Button size="sm" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}><LayoutList className="size-3.5" /> List</Button><Button size="sm" variant={view === "kanban" ? "default" : "outline"} onClick={() => setView("kanban")}><Columns3 className="size-3.5" /> Board</Button></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[180px] flex-1"><Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input list="location-search-suggestions" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search business, type, address, city, state, ZIP..." className="h-8 rounded-lg pl-8 text-sm" /><datalist id="location-search-suggestions">{suggestions.map((value) => <option key={value} value={value} />)}</datalist></div>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}><SelectTrigger className="h-8 w-36 rounded-lg text-xs"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select>
            <Button variant="ghost" size="icon-sm" onClick={() => void sync()} disabled={syncing}><RefreshCw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} /></Button>
          </div>

          {view === "kanban" ? (
            <div className="grid gap-3 overflow-x-auto pb-2 xl:grid-cols-4">
              {KANBAN_STATUSES.map((status) => {
                const items = filteredRows.filter((row) => row.status === status).slice(0, 100);
                return <div key={status} className="min-h-48 rounded-xl border bg-muted/20 p-3">
                  <div className="mb-3 flex items-center justify-between"><StatusBadge status={status} /><span className="text-xs text-muted-foreground">{items.length}</span></div>
                  <div className="space-y-2">{items.map((item) => {
                    const actions = getActions("ATM Lead", item.status, Boolean(session?.is_manager), false, Boolean(session?.user));
                    return <div key={item.name} className="rounded-lg border bg-background p-2 text-left shadow-sm"><button onClick={() => setLeadDetail(item.name)} className="w-full"><p className="truncate text-sm font-medium">{item.business_name || item.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{item.city || "-"}, {item.state || "-"}</p></button><div className="mt-2 flex flex-wrap gap-1">{actions.slice(0, 2).map((action) => <Button key={action.action} size="sm" variant="outline" className={actionColor(action.action)} disabled={processing === item.name} onClick={() => void handleAction(item, action)}>{action.label}</Button>)}</div></div>;
                  })}</div>
                </div>;
              })}
            </div>
          ) : pageRows.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">No locations found</div> : (
            <>
              <div className="mb-2 text-xs text-muted-foreground">{filteredRows.length} cached locations · synced on demand</div>
              <div className="divide-y">
                {pageRows.map((item, index) => {
                  const actions = getActions("ATM Lead", item.status, Boolean(session?.is_manager), false, Boolean(session?.user));
                  return <div key={item.name} className="grid grid-cols-[3rem_minmax(0,1fr)_8rem_auto] items-center gap-3 py-2.5 hover:bg-muted/30">
                    <span className="text-center text-xs text-muted-foreground">{(page - 1) * PAGE_SIZE + index + 1}</span>
                    <button className="min-w-0 text-left" onClick={() => setLeadDetail(item.name)}><p className="truncate text-sm font-medium">{item.business_name || item.name}</p><p className="truncate text-xs text-muted-foreground">{item.business_type || "-"}</p><p className="truncate text-xs text-muted-foreground">{item.full_address || "No address"} · {item.city || "-"}, {item.state || "-"} · {item.zip_code || "-"}</p></button>
                    <StatusBadge status={item.status} />
                    <div className="flex gap-1">{actions.slice(0, 2).map((action) => <Button key={action.action} size="sm" variant="outline" className={actionColor(action.action)} disabled={processing === item.name} onClick={() => void handleAction(item, action)}>{action.action === "approve" && <ThumbsUp className="size-3" />}{action.action === "reject" && <ThumbsDown className="size-3" />}{action.action === "install" && <Wrench className="size-3" />}{action.action === "convert" && <Zap className="size-3" />}{action.label}</Button>)}</div>
                  </div>;
                })}
              </div>
              <div className="flex items-center justify-between border-t pt-4 text-sm"><span className="text-muted-foreground">Page {page} of {pageCount}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft /> Previous</Button><Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)}>Next <ChevronRight /></Button></div></div>
            </>
          )}
        </CardContent>
      </Card>
      <LeadDetailDialog leadName={leadDetail} open={!!leadDetail} onClose={() => setLeadDetail(null)} onUpdated={sync} />
    </div>
  );
}
