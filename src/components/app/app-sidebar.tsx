import {
  LayoutDashboard,
  MapPin,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  UserRound,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type NavItem = {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const ALL_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "locations", label: "Locations", icon: MapPin },
  { id: "company", label: "Company", icon: Building2 },
  { id: "users", label: "Users", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "profile", label: "Profile", icon: UserRound },
];

export function AppSidebar({
  activePage,
  onNavigate,
  session,
  onLogout,
  mobileOpen,
  setMobileOpen,
  availablePages,
}: {
  activePage: string;
  onNavigate: (page: string) => void;
  session: { user: string; full_name?: string; role_type?: string; branding?: { brand_name: string; brand_subtitle: string; logo: string | null } } | null;
  onLogout: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  availablePages: string[];
}) {
  const brandName = session?.branding?.brand_name || "Xperts Global CRM";
  const brandSubtitle = session?.branding?.brand_subtitle || "Location Intelligence";
  const logoUrl = session?.branding?.logo || null;
  const navItems = ALL_NAV_ITEMS.filter((item) => availablePages.includes(item.id));

  const sidebar = (
    <aside className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        {logoUrl ? (
          <img src={logoUrl} alt={brandName} className="size-10 shrink-0 rounded-xl object-contain" />
        ) : (
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-bold text-sm">
            {brandName.charAt(0)}
          </div>
        )}
        <div className="min-w-0 text-start">
          <strong className="block truncate text-sm font-semibold">{brandName}</strong>
          <span className="block truncate text-xs text-sidebar-foreground/70">{brandSubtitle}</span>
        </div>
        <Button variant="ghost" size="icon-sm" className="ms-auto md:hidden" onClick={() => setMobileOpen(false)}>
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "h-9 w-full justify-start gap-2.5 rounded-lg px-3 text-start text-sm",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 rounded-lg bg-sidebar-accent/50 px-3 py-2 text-start">
          <div className="truncate text-xs font-medium text-sidebar-foreground">{session?.full_name || session?.user || "Guest"}</div>
          <div className="truncate text-[10px] text-sidebar-foreground/60">{session?.role_type || ""}</div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={onLogout}>
          <LogOut className="size-3.5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:fixed md:inset-y-0 md:start-0 md:z-30 md:flex md:w-60">{sidebar}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-60 shadow-xl">{sidebar}</div>
        </div>
      )}
    </>
  );
}
