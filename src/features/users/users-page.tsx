import { useEffect, useState } from "react";
import { Users, LoaderCircle, Plus, RefreshCw, Mail, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { call } from "@/lib/api";
import { toast } from "sonner";

type PortalUser = {
  name: string;
  full_name: string;
  email: string;
  enabled: boolean;
  creation: string;
};

export function UsersPage() {
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const result = await call<{ rows: PortalUser[] }>("cclms.api.users.list_portal_users", undefined, { mutation: false });
      setUsers(result?.rows || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createEmail || !createName || !createPassword) return;
    setCreating(true);
    try {
      await call("cclms.api.users.create_company_user", {
        email: createEmail,
        full_name: createName,
        password: createPassword,
      }, { mutation: true });
      toast.success("User created");
      setShowCreate(false);
      setCreateEmail("");
      setCreateName("");
      setCreatePassword("");
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Portal Users
          </h2>
          <p className="text-sm text-muted-foreground">Users in your company</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-lg" onClick={load} disabled={loading}>
            <RefreshCw className="size-3.5 mr-1" />
            Refresh
          </Button>
          <Button size="sm" className="rounded-lg gap-1.5" onClick={() => setShowCreate(true)}>
            <UserPlus className="size-3.5" />
            Add User
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-zinc-600" />
            Users
          </CardTitle>
          <CardDescription>All portal users in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16"><LoaderCircle className="size-5 animate-spin text-zinc-600" /></div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Users className="size-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="divide-y">
              {users.map((user) => (
                <div key={user.name} className="flex items-center gap-3 py-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {(user.full_name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{user.full_name || user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <span className={`text-xs ${user.enabled ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {user.enabled ? "Active" : "Disabled"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-4" />
              Create Portal User
            </DialogTitle>
            <DialogDescription>Add a new user to your company</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Full Name
              <Input value={createName} onChange={(e) => setCreateName(e.target.value)} required placeholder="John Doe" className="rounded-lg" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Email
              <Input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} required placeholder="john@company.com" className="rounded-lg" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Password
              <Input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} required minLength={8} placeholder="Min 8 characters" className="rounded-lg" />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={creating} className="gap-1.5">
                {creating ? <LoaderCircle className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                Create User
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
