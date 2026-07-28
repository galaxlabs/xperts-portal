import { useState } from "react";
import { Settings, Moon, Sun, Monitor, KeyRound, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { call } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

type ThemeMode = "light" | "dark" | "system";

export function SettingsPage({
  theme,
  onThemeChange,
}: {
  theme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}) {
  const { session } = useAuth();

  const modes: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
    { mode: "light", icon: Sun, label: "Light" },
    { mode: "dark", icon: Moon, label: "Dark" },
    { mode: "system", icon: Monitor, label: "System" },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-4 text-primary" />
            Preferences
          </CardTitle>
          <CardDescription>Theme and portal settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-3">Theme</p>
            <div className="flex gap-2">
              {modes.map(({ mode, icon: Icon, label }) => (
                <Button
                  key={mode}
                  variant={theme === mode ? "default" : "outline"}
                  size="sm"
                  className="rounded-lg gap-1.5"
                  onClick={() => onThemeChange(mode)}
                >
                  <Icon className="size-3.5" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium">Portal Version</p>
            <p className="text-xs text-muted-foreground mt-1">{session?.branding?.brand_name || "Xperts Global CRM"} Portal v1.0.0</p>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordCard />
    </div>
  );
}

function ChangePasswordCard() {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== confirmPass) { toast.error("Passwords do not match"); return; }
    if (newPass.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setBusy(true);
    try {
      await call("cclms.api.users.change_password", { current_password: currentPass, new_password: newPass }, { mutation: true });
      toast.success("Password changed successfully");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4 text-primary" />
          Change Password
        </CardTitle>
        <CardDescription>Update your account password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChange} className="space-y-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Current Password
            <div className="relative">
              <Input type={showCurrent ? "text" : "password"} value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} autoComplete="current-password" required placeholder="Enter current password" className="rounded-lg pr-9" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            New Password
            <div className="relative">
              <Input type={showNew ? "text" : "password"} value={newPass} onChange={(e) => setNewPass(e.target.value)} autoComplete="new-password" required placeholder="Min 8 characters" className="rounded-lg pr-9" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Confirm New Password
            <Input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} autoComplete="new-password" required placeholder="Repeat new password" className="rounded-lg" />
          </label>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={busy} className="rounded-lg gap-1.5">
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              {busy ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
