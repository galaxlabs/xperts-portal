import { useEffect, useState } from "react";
import {
  LoaderCircle, MapPin, TrendingUp, RefreshCw,
  BarChart3, CheckCircle2, XCircle, FileSignature, Wrench, Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { call } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

type DashboardData = {
  counts: {
    total?: number;
    by_status?: Record<string, number>;
  };
  recent?: any[];
  recent_locations?: any[];
};

const STATUS_BAR_COLOR: Record<string, string> = {
  "Pending Review": "from-amber-400 to-orange-500",
  Approved: "from-emerald-400 to-green-500",
  Rejected: "from-rose-400 to-red-500",
  Signed: "from-violet-400 to-purple-500",
  Installed: "from-teal-400 to-cyan-500",
  Live: "from-emerald-400 to-teal-500",
  Cancelled: "from-gray-400 to-slate-500",
};

function StatusPill({ status }: { status: string }) {
  const label = status === "null" || !status ? "Unassigned" : status;
  const colors: Record<string, string> = {
    "Pending Review": "bg-amber-100 text-amber-700 ring-amber-300",
    Approved: "bg-emerald-100 text-emerald-700 ring-emerald-300",
    Rejected: "bg-rose-100 text-rose-700 ring-rose-300",
    Signed: "bg-violet-100 text-violet-700 ring-violet-300",
    Live: "bg-emerald-100 text-emerald-700 ring-emerald-300",
    Installed: "bg-teal-100 text-teal-700 ring-teal-300",
    Cancelled: "bg-gray-100 text-gray-500 ring-gray-300",
  };
  const cls = colors[label] || "bg-gray-100 text-gray-600 ring-gray-300";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>{label}</span>;
}

function StatusBreakdownChart({ leadStatus }: { leadStatus: Record<string, number> }) {
  const total = Object.values(leadStatus).reduce((a, b) => a + b, 0);
  const entries = Object.entries(leadStatus).sort(([, a], [, b]) => b - a);
  if (entries.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p>;

  return (
    <div className="space-y-3">
      {entries.map(([status, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const barColor = STATUS_BAR_COLOR[status] || "from-gray-400 to-slate-500";
        return (
          <div key={status} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <StatusPill status={status} />
              <span className="text-sm font-medium tabular-nums">{count}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardPage() {
  const { session } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const method = session?.dashboard_method || "cclms.api.portal.get_dashboard";
      const result = await call<any>(method, undefined, { mutation: true });
      setData(result || null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><LoaderCircle className="size-6 animate-spin text-primary" /></div>;

  const counts = data?.counts || {};
  const c = counts.by_status || {};
  const leads = data?.recent || data?.recent_locations || [];
  const totalLeads = counts.total || 0;
  const pendingReview = c["Pending Review"] || 0;
  const approved = c["Approved"] || 0;
  const signed = c["Signed"] || 0;
  const rejected = c["Rejected"] || 0;
  const live = c["Live"] || 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{session?.branding?.brand_name || "Xperts Global CRM"}</h1>
            <p className="mt-1 text-sm text-zinc-400">Location Intelligence Dashboard</p>
          </div>
          <Button size="sm" variant="ghost" className="gap-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/20" onClick={load}>
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur">
            <p className="text-2xl font-bold">{totalLeads}</p>
            <p className="text-xs text-zinc-400">Total Leads</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur">
            <p className="text-2xl font-bold">{pendingReview}</p>
            <p className="text-xs text-zinc-400">Pending Review</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur">
            <p className="text-2xl font-bold">{approved}</p>
            <p className="text-xs text-zinc-400">Approved</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur">
            <p className="text-2xl font-bold">{signed}</p>
            <p className="text-xs text-zinc-400">Signed</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-white/5 p-3 text-center backdrop-blur">
            <p className="text-2xl font-bold">{rejected}</p>
            <p className="text-xs text-zinc-400">Rejected</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 text-center backdrop-blur">
            <p className="text-2xl font-bold">{live}</p>
            <p className="text-xs text-zinc-400">Live</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-0 shadow-sm ring-1 ring-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="size-4 text-zinc-600" /> Lead Status</CardTitle>
            <CardDescription>Breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusBreakdownChart leadStatus={c} />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><MapPin className="size-4 text-zinc-600" /> Recent Locations</CardTitle>
            <CardDescription>Latest submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leads.slice(0, 5).map((l: any) => (
                <div key={l.name} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm">
                  <MapPin className="size-3.5 shrink-0 text-gray-400" />
                  <span className="flex-1 truncate">{l.business_name || l.name}</span>
                  <StatusPill status={l.status} />
                  <span className="shrink-0 text-xs text-gray-400">{l.city || ""}</span>
                </div>
              ))}
              {leads.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No locations yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
