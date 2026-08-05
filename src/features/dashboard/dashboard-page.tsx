import { useEffect, useState } from "react";
import {
  LoaderCircle, MapPin, RefreshCw,
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
  city_stats?: LocationStat[];
  zip_stats?: LocationStat[];
  region_stats?: LocationStat[];
};

type LocationStat = { label: string; total: number; signed: number; installed: number };

const STATUS_BAR_COLOR: Record<string, string> = {
  "Pending Review": "from-amber-400 to-orange-500",
  Approved: "from-emerald-400 to-green-500",
  Rejected: "from-rose-400 to-red-500",
  Signed: "from-violet-400 to-purple-500",
  "Signed Rejected": "from-orange-400 to-amber-500",
  Installed: "from-teal-400 to-cyan-500",
  Converted: "from-sky-400 to-blue-500",
};

function StatusPill({ status }: { status: string }) {
  const label = status === "null" || !status ? "Unassigned" : status;
  const colors: Record<string, string> = {
    "Pending Review": "bg-amber-100 text-amber-700 ring-amber-300",
    Approved: "bg-emerald-100 text-emerald-700 ring-emerald-300",
    Rejected: "bg-rose-100 text-rose-700 ring-rose-300",
    Signed: "bg-violet-100 text-violet-700 ring-violet-300",
    "Signed Rejected": "bg-orange-100 text-orange-700 ring-orange-300",
    Converted: "bg-sky-100 text-sky-700 ring-sky-300",
    Installed: "bg-teal-100 text-teal-700 ring-teal-300",
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

function LocationAnalytics({ title, data }: { title: string; data: LocationStat[] }) {
  const max = Math.max(...data.map((item) => item.total), 1);
  return (
    <Card className="border-0 shadow-sm ring-1 ring-gray-200">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="size-4 text-zinc-600" /> {title}</CardTitle><CardDescription>Total locations with signed and installed counts</CardDescription></CardHeader>
      <CardContent>{data.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p> : <div className="space-y-3">{data.map((item) => <div key={item.label}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate font-medium">{item.label}</span><span className="shrink-0 text-xs text-muted-foreground">{item.total} total · {item.signed} signed · {item.installed} installed</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${Math.round((item.total / max) * 100)}%` }} /></div></div>)}</div>}</CardContent>
    </Card>
  );
}

function ConversionDonut({ data }: { data: LocationStat[] }) {
  const total = data.reduce((sum, item) => sum + item.total, 0);
  const signed = data.reduce((sum, item) => sum + item.signed, 0);
  const installed = data.reduce((sum, item) => sum + item.installed, 0);
  const signedDegrees = total ? Math.round((signed / total) * 360) : 0;
  const installedDegrees = total ? Math.round((installed / total) * 360) : 0;
  const background = `conic-gradient(#8b5cf6 0deg ${signedDegrees}deg, #14b8a6 ${signedDegrees}deg ${signedDegrees + installedDegrees}deg, #e5e7eb ${signedDegrees + installedDegrees}deg 360deg)`;
  return <Card className="border-0 shadow-sm ring-1 ring-gray-200"><CardHeader className="pb-3"><CardTitle className="text-base">Portfolio Conversion</CardTitle><CardDescription>Signed and installed share of visible locations</CardDescription></CardHeader><CardContent><div className="flex items-center gap-5"><div className="relative grid size-32 shrink-0 place-items-center rounded-full" style={{ background }}><div className="grid size-20 place-items-center rounded-full bg-card text-center"><span className="text-xl font-bold">{total}</span><span className="text-[10px] text-muted-foreground">locations</span></div></div><div className="space-y-2 text-sm"><p><span className="me-2 inline-block size-2 rounded-full bg-violet-500" /> Signed: <b>{signed}</b></p><p><span className="me-2 inline-block size-2 rounded-full bg-teal-500" /> Installed: <b>{installed}</b></p><p><span className="me-2 inline-block size-2 rounded-full bg-gray-200" /> Remaining: <b>{Math.max(0, total - signed - installed)}</b></p></div></div></CardContent></Card>;
}

function RegionInsights({ data }: { data: LocationStat[] }) {
  const mostInstalled = data.toSorted((a, b) => b.installed - a.installed)[0];
  const mostSigned = data.toSorted((a, b) => b.signed - a.signed)[0];
  const max = Math.max(...data.map((item) => item.total), 1);
  return <Card className="border-0 shadow-sm ring-1 ring-gray-200"><CardHeader className="pb-3"><CardTitle className="text-base">Regional Leaders</CardTitle><CardDescription>State-level signed and installed performance</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-teal-50 p-3 dark:bg-teal-950/20"><p className="text-xs text-muted-foreground">Most installed</p><p className="mt-1 truncate text-sm font-semibold">{mostInstalled?.label || "-"}</p><p className="text-2xl font-bold text-teal-600">{mostInstalled?.installed || 0}</p></div><div className="rounded-xl bg-violet-50 p-3 dark:bg-violet-950/20"><p className="text-xs text-muted-foreground">Most signed</p><p className="mt-1 truncate text-sm font-semibold">{mostSigned?.label || "-"}</p><p className="text-2xl font-bold text-violet-600">{mostSigned?.signed || 0}</p></div></div><div className="flex flex-wrap items-end gap-2 pt-1">{data.map((item) => <div key={item.label} className="grid place-items-center rounded-full bg-primary/10 text-center text-[10px] font-medium text-primary" style={{ width: `${36 + Math.round((item.total / max) * 44)}px`, height: `${36 + Math.round((item.total / max) * 44)}px` }} title={`${item.label}: ${item.total} total, ${item.signed} signed, ${item.installed} installed`}>{item.label.slice(0, 2).toUpperCase()}<span className="block text-[9px]">{item.total}</span></div>)}</div></CardContent></Card>;
}

export function DashboardPage() {
  const { session } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const companyContext = session?.companies && session.companies.length > 1
    ? `${session.company} + ${session.companies.length - 1} companies`
    : session?.company || session?.branding?.brand_name || "Xperts Global";

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const result = await call<DashboardData>("cclms.api.portal_api_v3.get_dashboard", undefined, { mutation: true });
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
  const signedRejected = c["Signed Rejected"] || 0;
  const installed = c["Installed"] || 0;
  const converted = c["Converted"] || 0;
  const cards = [
    { label: "Total Locations", value: totalLeads, status: "", icon: MapPin },
    { label: "Pending Review", value: pendingReview, status: "Pending Review", icon: BarChart3 },
    { label: "Approved", value: approved, status: "Approved", icon: CheckCircle2 },
    { label: "Rejected", value: rejected, status: "Rejected", icon: XCircle },
    { label: "Signed Rejected", value: signedRejected, status: "Signed Rejected", icon: XCircle },
    { label: "Signed", value: signed, status: "Signed", icon: FileSignature },
    { label: "Installed", value: installed, status: "Installed", icon: Wrench },
    ...(converted > 0 ? [{ label: "Converted", value: converted, status: "Converted", icon: Zap }] : []),
  ];

  function openLocations(status: string) {
    const params = new URLSearchParams({ page: "locations" });
    if (status) params.set("status", status);
    window.location.assign(`/?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">Welcome, {session?.full_name || "there"}</h1>
            <p className="mt-1 text-sm text-zinc-400">{companyContext} · Location Intelligence</p>
          </div>
          <Button size="sm" variant="ghost" className="gap-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/20" onClick={load}>
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cards.map(({ label, value, status, icon: Icon }) => (
            <button key={label} type="button" onClick={() => openLocations(status)} className="rounded-xl bg-white/10 p-3 text-center backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <Icon className="mx-auto mb-1 size-3.5 text-zinc-400" />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-zinc-400">{label}</p>
            </button>
          ))}
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
      <div className="grid gap-5 xl:grid-cols-2">
        <LocationAnalytics title="City Performance" data={data?.city_stats || []} />
        <LocationAnalytics title="ZIP Code Performance" data={data?.zip_stats || []} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <LocationAnalytics title="Regional Performance" data={data?.region_stats || []} />
        <div className="grid gap-5 sm:grid-cols-2"><ConversionDonut data={data?.region_stats || []} /><RegionInsights data={data?.region_stats || []} /></div>
      </div>
    </div>
  );
}
