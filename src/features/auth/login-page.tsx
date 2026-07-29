import { useState } from "react";
import { LogIn, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginPage({
  onLogin,
  error,
  branding,
}: {
  onLogin: (username: string, password: string) => Promise<void>;
  error: string;
  branding?: { brand_name?: string; brand_subtitle?: string; logo?: string | null };
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLocalError("");
    try {
      await onLogin(username, password);
    } catch (err: any) {
      setLocalError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  const displayError = localError || error;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[#17171D] p-12 lg:flex lg:flex-col lg:justify-between">
        <img src="/xperts-splash.svg" alt="Xperts Global location intelligence" className="absolute inset-0 size-full object-cover opacity-80" />
        <div className="relative flex items-center gap-3 text-white"><img src="/xperts-mark.svg" alt="" className="size-11" /><span className="text-lg font-semibold">Xperts Global</span></div>
        <div className="relative"><p className="max-w-sm text-4xl font-semibold leading-tight text-white">Move every location from prospect to performance.</p><p className="mt-4 text-sm text-zinc-400">A focused workspace for your ATM location portfolio.</p></div>
      </aside>
      <div className="flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-50/50 px-4 dark:from-zinc-950/20 dark:via-background dark:to-zinc-950/10">
      <Card className="w-full max-w-sm border-0 shadow-2xl ring-1 ring-foreground/5">
        <CardHeader className="items-center text-center pt-8">
          <img src="/xperts-mark.svg" alt="Xperts Global" className="mb-3 size-14 rounded-2xl shadow-lg" />
          <CardTitle className="text-xl">Xperts Global CRM</CardTitle>
          <CardDescription>
            {branding?.brand_name ? `${branding.brand_name} · Location Intelligence` : "Location Intelligence"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Email or Username
              <Input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" placeholder="you@company.com" className="rounded-lg" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Password
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Enter your password" className="rounded-lg" />
            </label>
            {displayError && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{displayError}</p>}
            <Button type="submit" size="lg" className="rounded-lg" disabled={busy}>
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              {busy ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
