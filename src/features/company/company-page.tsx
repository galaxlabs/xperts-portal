import { useEffect, useState } from "react";
import { Building2, LoaderCircle, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { call } from "@/lib/api";
import { toast } from "sonner";

export function CompanyPage() {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const result = await call<any>("cclms.api.portal.get_portal_config", undefined, { mutation: false });
      if (result?.branding) {
        setCompany(result.branding);
        setForm({
          brand_name: result.branding.brand_name || "",
          brand_subtitle: result.branding.brand_subtitle || "",
        });
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await call("cclms.api.portal.update_portal_config", {
        brand_name: form.brand_name,
        brand_subtitle: form.brand_subtitle,
      }, { mutation: true });
      toast.success("Company branding updated");
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            Company Profile
          </h2>
          <p className="text-sm text-muted-foreground">{company?.brand_name || "Xperts Global CRM"}</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-lg" onClick={load} disabled={loading}>
          <RefreshCw className="size-3.5 mr-1" />
          Refresh
        </Button>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branding Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Brand Name
                <Input value={form.brand_name} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} className="rounded-lg" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Brand Subtitle
                <Input value={form.brand_subtitle} onChange={(e) => setForm({ ...form, brand_subtitle: e.target.value })} className="rounded-lg" />
              </label>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" className="rounded-lg" disabled={saving}>
                {saving ? <LoaderCircle className="size-4 animate-spin mr-1" /> : <Save className="size-4 mr-1" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
