import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Toaster } from "sonner";

import { AppSidebar } from "@/components/app/app-sidebar";
import { AppHeader } from "@/components/app/app-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { LoginPage } from "@/features/auth/login-page";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { LocationsPage } from "@/features/locations/locations-page";
import { CompanyPage } from "@/features/company/company-page";
import { UsersPage } from "@/features/users/users-page";
import { SettingsPage } from "@/features/settings/settings-page";
import { getBranding } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

type PageId = "dashboard" | "locations" | "company" | "users" | "settings" | "profile";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  locations: "Locations",
  company: "Company Profile",
  users: "Portal Users",
  settings: "Settings",
  profile: "Profile",
};

type ThemeMode = "light" | "dark" | "system";

function resolveTheme(mode: ThemeMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export default function App() {
  const { session, loading: authLoading, login, logout } = useAuth();
  const [activePage, setActivePage] = useState<PageId>(() => {
    const page = new URLSearchParams(window.location.search).get("page");
    return page && PAGE_TITLES[page] ? page as PageId : "dashboard";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem("xperts-theme") as ThemeMode) || "dark");
  const [loginError, setLoginError] = useState("");
  const [branding, setBranding] = useState<{ brand_name?: string; brand_subtitle?: string; logo?: string | null } | null>(null);

  const isDark = resolveTheme(theme);
  const availablePages = session?.available_pages || [];

  useEffect(() => {
    getBranding().then(setBranding);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("xperts-theme", theme);
  }, [isDark, theme]);

  useEffect(() => {
    if (availablePages.length > 0 && !availablePages.includes(activePage)) {
      setActivePage("dashboard");
    }
  }, [availablePages, activePage]);

  if (authLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-zinc-50 via-white to-zinc-50/50 dark:from-zinc-950/20 dark:via-background dark:to-zinc-950/10">
        <div className="flex items-center gap-3 rounded-2xl border bg-card px-6 py-4 shadow-sm">
          <LoaderCircle className="size-5 animate-spin text-primary" />
          <span className="text-sm font-medium">Connecting...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <LoginPage
        onLogin={async (username, password) => {
          setLoginError("");
          try {
            await login(username, password);
          } catch (err: any) {
            setLoginError(err.message);
            throw err;
          }
        }}
        error={loginError}
        branding={branding || session?.branding}
      />
    );
  }

  function renderPage() {
    switch (activePage) {
      case "dashboard": return <DashboardPage />;
      case "locations": return <LocationsPage />;
      case "company": return <CompanyPage />;
      case "users": return <UsersPage />;
      case "settings": return <SettingsPage theme={theme} onThemeChange={setTheme} />;
      case "profile": return <SettingsPage theme={theme} onThemeChange={setTheme} />;
      default: return <DashboardPage />;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50/40 via-white to-zinc-50/30 dark:from-zinc-950/10 dark:via-background dark:to-zinc-950/5">
      <AppSidebar
        activePage={activePage}
          onNavigate={(p) => {
            setActivePage(p as PageId);
            window.history.pushState({}, "", `/?page=${p}`);
          }}
        session={session}
        onLogout={logout}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        availablePages={availablePages}
      />

      <div className="md:ps-60">
        <AppHeader
          title={PAGE_TITLES[activePage] || activePage}
          onOpenMobile={() => setMobileOpen(true)}
          onToggleDark={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          dark={isDark}
        />

        <main className="px-4 pb-10 pt-5 md:px-6">
          <ScrollArea className="h-[calc(100vh-5rem)]">
            <ErrorBoundary>
              <div className="pb-8">{renderPage()}</div>
            </ErrorBoundary>
          </ScrollArea>
        </main>
      </div>

      <Toaster richColors position="top-center" closeButton />
    </div>
  );
}
