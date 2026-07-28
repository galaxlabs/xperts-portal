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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-50/50 px-4 dark:from-zinc-950/20 dark:via-background dark:to-zinc-950/10">
      <Card className="w-full max-w-sm border-0 shadow-2xl ring-1 ring-foreground/5">
        <CardHeader className="items-center text-center pt-8">
          <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#1F1F25] text-white shadow-lg">
            <span className="text-xl font-bold">X</span>
          </div>
          <CardTitle className="text-xl">{branding?.brand_name || "Xperts Global CRM"}</CardTitle>
          <CardDescription>
            {branding?.brand_subtitle || "Location Intelligence"}
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
  );
}
