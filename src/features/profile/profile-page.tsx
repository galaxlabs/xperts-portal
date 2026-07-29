import { useEffect, useState } from "react";
import { Building2, LoaderCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { call } from "@/lib/api";
import { toast } from "sonner";

type CompanyProfile = {
  operator_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  business_address?: string;
};

export function ProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const result = await call<CompanyProfile>("cclms.api.portal_api_v4.get_company_profile", undefined, { mutation: false });
      setProfile(result);
      setForm({
        contact_name: result.contact_name || "",
        contact_email: result.contact_email || "",
        contact_phone: result.contact_phone || "",
        website: result.website || "",
        business_address: result.business_address || "",
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await call<CompanyProfile>("cclms.api.portal_api_v4.update_company_profile", { data: form }, { mutation: true });
      setProfile(result);
      toast.success("Business profile updated");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><LoaderCircle className="size-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Building2 className="size-5 text-primary" /> Business Profile</h2>
        <p className="text-sm text-muted-foreground">Keep your operator business contact information current.</p>
      </div>

      <form onSubmit={save}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{profile?.operator_name}</CardTitle>
            <CardDescription>Operator name is managed by Xperts Global and cannot be changed here.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium">Contact Name<Input value={form.contact_name || ""} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">Contact Email<Input type="email" value={form.contact_email || ""} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">Contact Phone<Input value={form.contact_phone || ""} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">Website<Input type="url" value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} /></label>
            <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">Business Address<Textarea value={form.business_address || ""} onChange={(e) => setForm({ ...form, business_address: e.target.value })} /></label>
            <div className="flex justify-end sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />} Save Business Profile</Button></div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
